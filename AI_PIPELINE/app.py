from fastapi import FastAPI, HTTPException, UploadFile, Form, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from typing import List, Dict, Optional
from copy import deepcopy

import os
import json
import re
import time
import concurrent.futures
import io
import logging
import traceback
from pathlib import Path
import tempfile

from dotenv import load_dotenv
load_dotenv()

# ---- Imports for Hugging Face Deployment ----
import base64



import google.generativeai as genai
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

from google import genai as genai_sdk  
from google.genai.types import GenerateContentConfig

from huggingface_hub import HfApi, snapshot_download
from huggingface_hub.utils import HfHubHTTPError
# ---------------------------------------------

# ---- Configure Logging ----
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # <-- Only log to the console
    ]
)
logger = logging.getLogger(__name__)

from PIL import Image
from pdf2image import convert_from_path

# ---- LangChain / Embeddings / Vector Store ----
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
# from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings 
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

import platform

# ---- Vertex AI / Imagen Import (For Image Generation) ----
try:
    import vertexai
    from vertexai.preview.vision import ImageGenerationModel

    vertexai.init(project="gen-lang-client-0238295665", location="us-central1")

    HAS_VERTEX_IMAGE_GEN = True
except ImportError:
    HAS_VERTEX_IMAGE_GEN = False
    logger.warning("Vertex AI SDK not found. Realistic image generation will fail or mock.")

def get_poppler_path():
    """
    Returns the Poppler path based on the OS.
    - On Windows: Returns the local path (Update this to YOUR specific path).
    - On Linux/Cloud: Returns None (uses system PATH).
    """
    if platform.system() == "Windows":
        # ⚠️ UPDATE THIS PATH to where YOU extracted Poppler on your machine ⚠️
        # Example: r"C:\Users\devja\Documents\poppler-24.08.0\Library\bin"
        return r"C:\Users\suraj namdev gitte\Downloads\Release-25.07.0-0\poppler-25.07.0\Library\bin" 
    
    # On Linux / Hugging Face Spaces, Poppler is usually in the system PATH
    return None

import base64

def pil_to_part(image, max_size=(1600, 1600), quality=70):
    if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
        image.thumbnail(max_size)

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=quality, optimize=True)

    return {
        "mime_type": "image/jpeg",
        "data": base64.b64encode(buffer.getvalue()).decode("utf-8")
    }


# ---- Config ----
# Use a standard path. On HF Spaces, this will be ephemeral.
# We will download/upload to this path from the HF Dataset.
INDEX_DIR = "/tmp/faiss_index"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# ---- Initialize Embeddings ----
try:
    logger.info(f"Initializing embeddings with model: {MODEL_NAME}")
    embeddings = HuggingFaceEmbeddings(model_name=MODEL_NAME)
    logger.info("Embeddings initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize embeddings: {e}", exc_info=True)
    raise

def safe_gemini_generate(model, parts, retries=5):
    for attempt in range(retries):
        try:
            response = model.generate_content(parts)
            return response
        except Exception as e:
            wait = min(2 ** attempt, 20)
            time.sleep(wait)
    return None

def calculate_chapter_ranges(chapters, total_pages):
    """
    Converts a list of chapters with 'start_page' into definite ranges (start, end).
    Example: 
      Input: [{'start_page': 5}, {'start_page': 20}], total_pages=50
      Output: [(1, 4, "Front Matter"), (5, 19, "Chapter 1"), (20, 50, "Chapter 2")]
    """
    if not chapters:
        return []

    # Sort by start page
    sorted_chapters = sorted(chapters, key=lambda x: int(x.get("start_page", 0)))
    
    ranges = []
    
    # Handle pages before the first chapter (e.g. Preface, TOC)
    first_chap_start = int(sorted_chapters[0].get("start_page", 1))
    if first_chap_start > 1:
        ranges.append({
            "start": 1, 
            "end": first_chap_start - 1, 
            "title": "Front Matter / Introduction",
            "chapter_no": "0"
        })

    # Calculate ranges between chapters
    for i in range(len(sorted_chapters)):
        start = int(sorted_chapters[i].get("start_page"))
        title = sorted_chapters[i].get("chapter_title", "Unknown")
        chap_no = sorted_chapters[i].get("chapter_no", str(i+1))
        
        # End is (Next Chapter Start - 1) OR Total Pages if it's the last chapter
        if i < len(sorted_chapters) - 1:
            next_start = int(sorted_chapters[i+1].get("start_page"))
            end = max(start, next_start - 1)
        else:
            end = total_pages if total_pages else None # Open ended if total_pages unknown

        ranges.append({
            "start": start,
            "end": end,
            "title": title,
            "chapter_no": chap_no
        })
        
    return ranges

def extract_multimodal_elements_from_pdf(file_path: str, chapters: list = None, max_workers: int = 20):
    """
    High-Speed Parallel Extraction.
    Processes multiple batches simultaneously to fit within 2-3 minutes.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF not found: {file_path}")
    
    logger.info(f"🚀 Starting High-Speed Extraction for: {file_path}")
    
    # 1. Detect Total Pages
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        total_pages = len(reader.pages)
        logger.info(f"Total pages: {total_pages}")
    except:
        logger.info("PyPDF2 failed, using fallback.")
        total_pages = 500 # Safety upper limit

    # Initialize Model (Lightweight init)
    try:
        # We will init the model inside threads if needed, but global is okay for Flash
        model = genai.GenerativeModel("gemini-2.5-flash")
    except Exception as e:
        logger.error(f"Gemini Init failed: {e}")
        raise

    # ---------------------------------------------------------
    # CONFIGURATION
    # ---------------------------------------------------------
    BATCH_SIZE = 5      # Keep small for reliability
    WORKERS = 20        # High parallelism for speed (20 * 5 = 100 pages concurrent)
    
    # Prompts
    multi_page_prompt = """
    Analyze these {num_pages} textbook pages. 
    CONTEXT: {context_hint}
    
    Extract content for study material generation.

    RULES:
    1. TEXT: Summarize paragraphs clearly. Keep definitions and key dates exact.
    2. DIAGRAMS: Describe exactly what the diagram shows (e.g., "A diagram showing the human heart with labeled aorta and ventricles").
    3. FORMULAS: detailed mathematical formulas in LaTeX format strictly (e.g. $$ a^2 + b^2 = c^2 $$).
    4. TABLES: Represent as Markdown tables.

    OUTPUT XML FORMAT:
    <pages>
      <page number="1">
        <element type="text">...</element>
        <element type="diagram_caption">...</element>
        <element type="formula_latex">...</element>
      </page>
    </pages>
    
    Return ONLY XML. Use CDATA for special chars if needed.
    """

    # --- Worker Function (Runs in Parallel) ---
    def process_batch_task(batch_data):
        page_nums, pages, context_hint = batch_data
        
        # Quick exit
        if not pages: return []

        try:
            parts = [multi_page_prompt.format(num_pages=len(pages), context_hint=context_hint)]
            for p in pages:
                parts.append(pil_to_part(p, quality=70))
            
            # API Call
            resp = safe_gemini_generate(model, parts, retries=3)
            
            if not resp or not resp.candidates: 
                logger.warning(f"Batch {page_nums[0]}-{page_nums[-1]} empty response.")
                return []

            raw = resp.candidates[0].content.parts[0].text
            try:
                data = parse_xml_to_json(raw)
            except:
                logger.warning(f"Batch {page_nums[0]}-{page_nums[-1]} XML parse failed.")
                return []

            batch_els = []
            
            # Parse Structured Output
            if "pages" in data:
                for i, p_data in enumerate(data["pages"]):
                    # -------------------------------------------------
                    # 🛡️ ROBUST MAPPING (Fixes 'list index out of range')
                    # -------------------------------------------------
                    # Strategy: Trust the order of the list first. 
                    # If XML returns 5 pages and we sent 5, index 0 -> page_nums[0]
                    
                    if i < len(page_nums):
                        abs_p_num = page_nums[i]
                    else:
                        # LLM hallucinated extra pages? Skip.
                        continue

                    for el in p_data.get("elements", []):
                        el["page"] = abs_p_num
                        if context_hint != "General Content":
                            el["chapter_context"] = context_hint
                        batch_els.append(el)
            
            elif "elements" in data:
                # Single page fallback
                for el in data["elements"]:
                    el["page"] = page_nums[0]
                    batch_els.append(el)
            
            return batch_els

        except Exception as e:
            logger.error(f"Worker failed for Batch {page_nums[0]}-{page_nums[-1]}: {e}")
            return []

    # ---------------------------------------------------------
    # 1. PREPARE ALL TASKS (Map Ranges -> Batches)
    # ---------------------------------------------------------
    
    # Calculate Chapter Ranges
    processing_ranges = []
    if chapters:
        processing_ranges = calculate_chapter_ranges(chapters, total_pages)
    else:
        processing_ranges = [{"start": 1, "end": total_pages, "title": "General", "chapter_no": "1"}]

    all_tasks = [] # Will hold (page_nums, pages_images, context)

    # We need to load images. For 364 pages, loading ALL into RAM is ~2GB.
    # It's faster to load them in one go if you have RAM, otherwise we chunk the conversion.
    # For speed, we'll try to convert large chunks.
    
    logger.info("Preparing pages for parallel processing...")
    
    # Iterate through ranges and build tasks
    for r in processing_ranges:
        r_start = r["start"]
        r_end = r["end"] if r["end"] else total_pages
        if not r_end: r_end = r_start + 50 # Fallback
        
        context_label = f"Chapter {r.get('chapter_no')}: {r.get('title')}"
        
        # Loop through this chapter's pages
        for batch_start in range(r_start, r_end + 1, BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE - 1, r_end)
            
            # We delay image conversion slightly to avoid blocking everything upfront
            # But for `ThreadPoolExecutor`, we need arguments ready.
            # Efficient strategy: Convert this CHAPTER'S pages, then slice.
            pass 

    # ⚡ OPTIMIZED IMAGE LOADING STRATEGY
    # Converting 1 page at a time is slow. Converting 300 is RAM heavy.
    # Compromise: Convert by Chapter (or 50 page chunks), create tasks, then execute.
    
    tasks_ready_to_run = []
    
    current_page = 1
    # Global loop to fetch images efficiently
    while current_page <= total_pages:
        chunk_end = min(current_page + 50, total_pages)
        logger.info(f"Converting pages {current_page}-{chunk_end} into images...")
        
        try:
            # Batch Convert PDF -> Images (Much faster than 1-by-1)
            images_chunk = convert_from_path(
                file_path, 
                poppler_path=get_poppler_path(), 
                first_page=current_page, 
                last_page=chunk_end, 
                dpi=90 # Keep DPI low for speed
            )
        except Exception as e:
            logger.error(f"Conversion failed: {e}")
            break
            
        # Distribute these images into tasks based on our Ranges
        for i, img in enumerate(images_chunk):
            real_page_num = current_page + i
            
            # Find which chapter this page belongs to
            active_context = "General"
            for r in processing_ranges:
                if r["start"] <= real_page_num <= (r["end"] or 9999):
                    active_context = f"Chapter {r.get('chapter_no')}: {r.get('title')}"
                    break
            
            # Group into batches of 5
            # We can just append to a buffer
            if len(all_tasks) == 0 or len(all_tasks[-1][1]) >= BATCH_SIZE:
                # Start new batch
                all_tasks.append( ([real_page_num], [img], active_context) )
            else:
                # Add to existing batch
                # Check if context matches (don't mix chapters in one batch)
                last_task = all_tasks[-1]
                if last_task[2] == active_context:
                    last_task[0].append(real_page_num)
                    last_task[1].append(img)
                else:
                    all_tasks.append( ([real_page_num], [img], active_context) )

        current_page = chunk_end + 1

    logger.info(f"Created {len(all_tasks)} batch tasks. Starting Parallel Execution with {WORKERS} workers...")

    # ---------------------------------------------------------
    # 2. EXECUTE PARALLEL BATCHES
    # ---------------------------------------------------------
    all_elements = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as executor:
        # Submit all tasks
        future_to_batch = {
            executor.submit(process_batch_task, task): task[0] 
            for task in all_tasks
        }
        
        # Process results as they complete
        completed_count = 0
        total_tasks = len(all_tasks)
        
        for future in concurrent.futures.as_completed(future_to_batch):
            batch_nums = future_to_batch[future]
            try:
                results = future.result()
                if results:
                    all_elements.extend(results)
                completed_count += 1
                if completed_count % 5 == 0:
                    logger.info(f"Progress: {completed_count}/{total_tasks} batches done...")
            except Exception as exc:
                logger.error(f"Batch {batch_nums} generated an exception: {exc}")

    # Sort elements by page number to keep order sane
    all_elements.sort(key=lambda x: int(x.get("page", 0)))
    
    logger.info(f"🚀 Speed Extraction Complete. Extracted {len(all_elements)} elements.")
    return all_elements

def extract_chapters(file_path: str, num_pages: int = 15, max_workers: int = 10):
    """
    Extracts Chapters. Handles TOCs without page numbers by defaulting to 0.
    Ensures every chapter has a 'chapter_no' to prevent DB validation errors.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF not found: {file_path}")
        
    logger.info(f"Extracting Table of Contents from first {num_pages} pages...")
    
    # Initialize Vertex AI (with fallback)
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
    except:
        model = genai.GenerativeModel("gemini-2.5-flash")

    # UPDATED PROMPT: Explicitly handle missing page numbers
    prompt = """
    Analyze this page. Is it a Table of Contents (Index)?
    
    If YES, extract the chapters in this JSON format:
    [
      {"chapter_no": "1", "chapter_title": "Resources", "start_page": 1},
      {"chapter_no": "2", "chapter_title": "Land and Soil", "start_page": 0} 
    ]
    
    RULES:
    1. Extract the Title and the Page Number listed against it.
    2. **CRITICAL:** If NO page number is visible, set "start_page": 0. Do NOT guess.
    3. Return [] if this is not a TOC page.
    """

    try:
        pages = convert_from_path(file_path, poppler_path=get_poppler_path(), first_page=1, last_page=num_pages, dpi=90)
    except Exception as e:
        logger.error(f"PDF Convert Error: {e}")
        return []

    results = []
    
    def process_toc(page):
        try:
            resp = safe_gemini_generate(model, [prompt, pil_to_part(page)])
            if not resp or not resp.candidates: return []
            
            text = resp.candidates[0].content.parts[0].text
            json_match = re.search(r"\[[\s\S]*\]", text)
            if json_match:
                data = json.loads(clean_json_string(json_match.group(0)))
                return data if isinstance(data, list) else []
        except:
            return []
        return []

    # Scan pages
    for page in pages:
        res = process_toc(page)
        if res:
            results.extend(res)
            # Stop if we found a good TOC to save time
            if len(results) > 2: break 

    # --- 🛡️ FIX: SANITIZE DATA BEFORE RETURNING ---
    # This loop ensures 'chapter_no' ALWAYS exists.
    for item in results:
        # 1. Ensure chapter_no key exists
        if "chapter_no" not in item or item["chapter_no"] is None or str(item["chapter_no"]).strip() == "":
            # Try to extract number from title (e.g., "1. Real Numbers" -> "1")
            title_match = re.search(r'^(\d+)', str(item.get("chapter_title", "")))
            if title_match:
                item["chapter_no"] = title_match.group(1)
            else:
                # Default to "0" (safe for Preface, Intro, etc.)
                item["chapter_no"] = "0"
        
        # 2. Force it to be a string
        item["chapter_no"] = str(item["chapter_no"])

        # 3. Ensure other keys exist
        if "chapter_title" not in item:
            item["chapter_title"] = "Untitled Chapter"
        if "start_page" not in item:
            item["start_page"] = 0

    # Deduplicate
    seen = set()
    final_chapters = []
    for item in results:
        key = str(item.get("chapter_no")) + item.get("chapter_title", "").lower()
        if key not in seen:
            seen.add(key)
            final_chapters.append(item)
    
    # Sort
    def sorter(x):
        try: return int(re.search(r'\d+', str(x.get("chapter_no", "0"))).group())
        except: return 0
    final_chapters.sort(key=sorter)
    
    logger.info(f"Extracted {len(final_chapters)} chapters.")
    return final_chapters

def create_smart_chunks(subject_data, elements, chapters):
    """
    Refined Chunking with DEBUG LOGS:
    1. Maps pages to chapters.
    2. Groups text BY PAGE first.
    3. Splits large pages into chunks with correct metadata.
    """
    if not elements: return []
    if not chapters: chapters = [{"chapter_no": "1", "chapter_title": "Start", "start_page": 1}]

    logger.info("Creating chunks with Page-Level Granularity...")

    # --- PHASE 1: TITLE HUNTING ---
    for chap in chapters:
        if int(chap.get("start_page", 0)) == 0:
            target_title = re.sub(r'[^a-z0-9]', '', chap.get("chapter_title", "").lower())[:20]
            if len(target_title) < 4: continue
            
            for el in elements:
                content = re.sub(r'[^a-z0-9]', '', el.get("content", "").lower())[:100]
                if target_title in content:
                    chap["start_page"] = el.get("page", 1)
                    # LOGGING ADDED HERE
                    logger.info(f"Found Title '{chap['chapter_title']}' on Page {chap['start_page']}")
                    break

    # --- PHASE 2: MAP PAGES TO CHAPTERS ---
    chapters = sorted(chapters, key=lambda x: int(x.get("start_page", 0)))
    
    last_known_page = 1
    for chap in chapters:
        if int(chap.get("start_page", 0)) == 0: 
            chap["start_page"] = last_known_page + 1
        last_known_page = int(chap["start_page"])

    page_to_chap_map = {}
    for i, chap in enumerate(chapters):
        start = int(chap["start_page"])
        if i < len(chapters) - 1:
            end = int(chapters[i+1]["start_page"]) - 1
        else:
            end = 10000 
        
        # LOGGING ADDED HERE
        logger.info(f"Mapping Chapter {chap['chapter_no']} ({chap['chapter_title']}) to Pages {start}-{end}")
        
        for p in range(start, end + 1):
            page_to_chap_map[p] = chap

    # --- PHASE 3: GROUP CONTENT BY PAGE ---
    page_buffers = {} 

    for el in elements:
        pg = el.get("page", 1)
        content = el.get("content", "")
        
        fig_match = re.search(r'(?:Figure|Fig|Table|Ex)\.?\s*(\d+)', content, re.IGNORECASE)
        forced_chap = None
        if fig_match:
            detected_num = fig_match.group(1)
            forced_chap = next((c for c in chapters if str(c.get("chapter_no")) == detected_num), None)

        if forced_chap:
            assigned_chap = forced_chap
            # LOGGING ADDED HERE (Optional: can be noisy)
            # logger.debug(f"Page {pg}: Figure Intelligence forced Chapter {forced_chap['chapter_no']}")
        else:
            assigned_chap = page_to_chap_map.get(pg, chapters[0] if chapters else {})

        el_type = el.get("type", "text")
        if el_type == "formula_latex": prefix = f"\n[FORMULA]: $$ {content} $$\n"
        elif el_type == "diagram_caption": prefix = f"\n[DIAGRAM]: {content}\n"
        else: prefix = f"{content}\n"

        if pg not in page_buffers:
            page_buffers[pg] = {
                "text": "", 
                "chapter_no": assigned_chap.get("chapter_no", "Unknown"),
                "chapter_title": assigned_chap.get("chapter_title", "Unknown")
            }
        page_buffers[pg]["text"] += prefix

    # --- PHASE 4: CREATE CHUNKS ---
    chunks = []
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    sorted_pages = sorted(page_buffers.keys())

    for pg in sorted_pages:
        data = page_buffers[pg]
        raw_text = data["text"]
        
        page_splits = text_splitter.split_text(raw_text)
        
        for i, split_text in enumerate(page_splits):
            chunks.append(Document(
                page_content=split_text,
                metadata={
                    **subject_data,
                    "chapter_no": str(data["chapter_no"]),
                    "chapter_name": data["chapter_title"],
                    "page": int(pg),
                    "content_type": "textbook_content",
                    "pdf_name": subject_data.get("pdf_name", "doc"),
                    "chunk_index": i
                }
            ))

    logger.info(f"Created {len(chunks)} chunks from {len(sorted_pages)} pages.")
    return chunks

def process_pdf(subject_data: dict, file_path: str, max_toc_pages: int = 15):
    """
    Process PDF - extracts chapters and all content from the book.
    
    Args:
        subject_data: Dictionary with subject metadata
        file_path: Path to PDF file
        max_toc_pages: Maximum TOC pages to check (default 10)
    
    Returns:
        Tuple of (chapters, chunks)
    
    Raises:
        ValueError: If inputs are invalid
        FileNotFoundError: If PDF file doesn't exist
    """
    if not subject_data or not isinstance(subject_data, dict):
        raise ValueError("subject_data must be a non-empty dictionary")
    
    if not file_path or not isinstance(file_path, str):
        raise ValueError("file_path must be a non-empty string")
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found: {file_path}")
    
    start_time = time.time()
    print(f"Subject Data:  \n{subject_data}")
    
    try:
        # Step 1: Extract chapters
        logger.info("Step 1: Extracting chapters...")
        chapters = extract_chapters(file_path, num_pages=max_toc_pages, max_workers=10)
        logger.info(f"Extracted {len(chapters)} chapters")
        
        # Step 2: Extract content (Pass 'chapters' here!)
        logger.info("Step 2: Extracting content (TOC-Aware)...")
        # CHANGED THIS LINE
        elements = extract_multimodal_elements_from_pdf(file_path, chapters=chapters, max_workers=60)
        logger.info(f"Extracted {len(elements)} elements")

        # Step 3: Create chunks
        logger.info("Step 3: Creating chunks...")
        chunks = create_smart_chunks(subject_data, elements, chapters)
        
        return chapters, chunks
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"Error processing PDF after {elapsed_time:.2f} seconds: {e}", exc_info=True)
        raise

# ---- Utility Functions For Retrieving ----
def get_retriever_by_topic(topic_numbers: List[str], topic_names: List[str], request_data: dict, k: int = 10):
    """
    Retrieve Chunks using Strict Filtering by PDF Name and Chapter.
    """
    if not os.path.exists(INDEX_DIR):
        raise FileNotFoundError(f"FAISS index not found at {INDEX_DIR}")
    
    try:
        vectorstore = FAISS.load_local(INDEX_DIR, embeddings, allow_dangerous_deserialization=True)
        
        # --- STRICT FILTER FUNCTION ---
        def strict_filter(metadata):
            # 1. CRITICAL: Filter by Unique PDF Name
            # This ensures we only get chunks from the specific book requested
            requested_pdf = request_data.get("pdf_name")
            if requested_pdf:
                # Compare exactly. If metadata doesn't have pdf_name, skip it.
                if metadata.get("pdf_name") != requested_pdf:
                    return False
            
            # 2. Filter by Chapter Number
            # We only want chunks from the chapters selected in the UI
            doc_chapter = str(metadata.get("chapter_no", ""))
            allowed_chapters = [str(t) for t in topic_numbers]
            
            if doc_chapter not in allowed_chapters:
                return False
            
            return True
        # ------------------------------

        # INCREASE K to ensure we get "ALL" chunks for the topics
        # If the user wants 3 chapters, we want deeper retrieval than just top-10 global.
        # We increase 'k' significantly because the filter will prune unrelated docs anyway.
        effective_k = k * 3  # Fetch more, then filter down

        retriever = vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": effective_k, 
                "filter": strict_filter # Apply the strict filter
            }
        )
        return retriever

    except Exception as e:
        logger.error(f"Error loading retriever: {e}", exc_info=True)
        raise

def get_prompt_template(subject: str, requested_type: str):
    subject = subject.lower()
    requested_type = requested_type.lower()

    # -------- FORMAT RULES --------
    if any(x in requested_type for x in ['mcq', 'multiple choice', 'objective']):
        format_rules = """
        **FORMAT: MULTIPLE CHOICE (STRICT)**
        - Exactly 4 options.
        - **MANDATORY:** Options must start with lowercase letters and brackets: "a) ", "b) ", "c) ", "d) ".
        - Example: ["a) Option One", "b) Option Two", "c) Option Three", "d) Option Four"]
        - `correct_answer` must EXACTLY match one option string.
        """
    elif any(x in requested_type for x in ['true', 'false']):
        format_rules = "**FORMAT: TRUE / FALSE**"
    elif any(x in requested_type for x in ['fill', 'blank']):
        format_rules = "**FORMAT: FILL IN THE BLANKS (One blank per question)**"
    else:
        format_rules = """
        **FORMAT: SUBJECTIVE / DESCRIPTIVE (No options)**
        - The `options` list MUST be empty: [].
        - Do NOT provide choices.
        - Provide a detailed `correct_answer` for the evaluator.
        """

    # -------- VISUAL STRATEGY (STRICT TEXTBOOK COMPLIANCE) --------
    # This logic ensures we only create diagrams that actually exist in the source text.
    
    visual_instructions = """
    ### VISUALS: STRICT TEXTBOOK SOURCE ONLY
    
    **CRITICAL RULE:** You may ONLY request an image if a corresponding diagram description exists explicitly in the `TEXTBOOK CONTEXT` below (look for text tagged as `[DIAGRAM]` or descriptions of figures).
    
    1. **NO HALLUCINATION:** Do NOT invent diagrams. If the context does not describe a diagram for this specific topic, do NOT generate one.
    2. **MATCH CONTEXT:** The `prompt` for the image must be derived **directly** from the `[DIAGRAM]` description in the text.
    3. **LEVEL APPROPRIATE:** Ensure the complexity matches the `Class` level provided.
    
    **DECISION LOGIC:**
    - **Scenario A:** Context says: *"[DIAGRAM]: A cross-section of a flower showing stamen and pistil."*
      -> **Action:** You CAN ask: "Identify the part labeled 'A'..." 
      -> **Visual Annotation:** `{{ "required": true, "type": "image", "prompt": "Educational line drawing of a flower cross-section showing stamen and pistil. Label stamen as 'A'. Class {class_level} level. White background." }}`
      
    - **Scenario B:** Context explains photosynthesis textually but mentions no figure/diagram.
      -> **Action:** Do NOT generate an image. Ask a text-only question.
      
    - **Scenario C (Math):** Context describes a geometry problem.
      -> **Action:** Create an SVG visual.
      -> **Visual Annotation:** `{{ "required": true, "type": "svg", "prompt": "Triangle PQR with angle P=60 degrees..." }}`
    """

    # -------- FINAL PROMPT --------
    return PromptTemplate(
        input_variables=["context", "request_data", "question_type", "num_of_questions", "class_level", "marks_per_question", "format_instructions"],
        template=f"""
You are an expert examiner. Prepare a **final exam question paper**.

### EXAM DETAILS
- Subject: {subject}
- Class: {{class_level}}
- Question Type: {{question_type}}
- Num Questions: {{num_of_questions}}
- Marks: {{marks_per_question}}

### STRICT INSTRUCTIONS
1. 100% Syllabus aligned.
2. No repetition.
3. Language formal.

{visual_instructions}

### IMPORTANT: VISUAL QUESTION FORMAT
- Visual questions must FOLLOW the global `Question Type`.
- IF Question Type is **Subjective**: Visual questions must **NOT** have options (Set "options": []).
- IF Question Type is **MCQ**: Visual questions **MUST** have options ["a) ...", "b) ..."].

{format_rules}

### JSON OUTPUT STRUCTURE (MANDATORY)
{{{{
  "sectionTitle": "", // question_type
  "description": "",  // Description about question_type
  "questions": [
    {{{{
      "questionNo": 1,
      "question": "Text of question...",
      "options": ["a) Option A", "b) Option B"], // OR [] if Subjective
      "correct_answer": "...",
      "marks": {{marks_per_question}},
      "visual_annotation": {{{{
          "required": boolean,     // TRUE only if context contains [DIAGRAM] for this topic.
          "type": "svg" | "image",
          "prompt": "string"       // Must match the [DIAGRAM] description from context.
      }}}}
    }}}}
  ]
}}}}

### TEXTBOOK CONTEXT
{{context}}

### INPUT REQUEST
{{request_data}}

Return ONLY valid JSON.
"""
    )

def get_context_from_request(request_data: dict, k: int = 15): 
    """
    IMPROVED: Robust Chapter Matching & MMR Retrieval.
    """
    if not request_data or "questions" not in request_data:
        raise ValueError("Invalid request data")
    
    logger.info(f"Generating exam using MMR (Diversity Search)...")
    
    exam_paper = {
        "subject": request_data.get("subject", ""),
        "className": request_data.get("class", ""),
        "maxMarks": request_data.get("maxMarks", 0),
        "timeAllowed": request_data.get("timeAllowed", ""),
        "instructions": request_data.get("instructions", []),
        "sections": []
    }

    if not os.path.exists(INDEX_DIR): 
        raise FileNotFoundError(f"Index not found at {INDEX_DIR}")
        
    vectorstore = FAISS.load_local(INDEX_DIR, embeddings, allow_dangerous_deserialization=True)

    for q_idx, q in enumerate(request_data["questions"]):
        q_type = q.get("type", "Unknown")
        topics = q.get("topics", [])
        
        # --- FIX 1: ROBUST TOPIC PARSING ---
        # Handles: "1. Algebra", "Chapter 1", "1", "Unit 1"
        target_chapters = [] 
        for t in topics:
            # Try to extract the first number found in the string
            match = re.search(r"(\d+)", str(t))
            if match:
                chap_id = match.group(1) # Extract "1" from "Chapter 1"
                chap_name = str(t)       # Keep full name for search query
                target_chapters.append((chap_id, chap_name))
            else:
                # If no number found, assume it's a chapter name or ID without number
                # This is risky but better than skipping
                target_chapters.append((str(t), str(t)))

        if not target_chapters: 
            logger.warning(f"Could not parse any chapter numbers from topics: {topics}")
            continue

        all_contexts = []
        chunks_per_chapter = max(4, 25 // len(target_chapters))

        for chap_id, chap_name in target_chapters:
            
            # --- FIX 2: LOOSE FILTERING (String vs Int) ---
            # Metadata might store "1" (str) or 1 (int). We compare as strings.
            def specific_chapter_filter(metadata):
                # 1. Check PDF Name (if provided)
                if request_data.get("pdf_name"):
                    if metadata.get("pdf_name") != request_data.get("pdf_name"):
                        return False
                
                # 2. Check Chapter Number (Loose Match)
                meta_chap = str(metadata.get("chapter_no", "")).strip()
                target_chap = str(chap_id).strip()
                
                # Check exact match OR if one is zero-padded (e.g. "01" == "1")
                if meta_chap == target_chap:
                    return True
                try:
                    if int(meta_chap) == int(target_chap):
                        return True
                except:
                    pass
                    
                return False

            try:
                retriever = vectorstore.as_retriever(
                    search_type="mmr",
                    search_kwargs={
                        "k": chunks_per_chapter, 
                        "fetch_k": chunks_per_chapter * 4, 
                        "lambda_mult": 0.6, 
                        "filter": specific_chapter_filter
                    }
                )
                
                # Search query
                query = f"{chap_name} {q.get('llm_note', '')}"
                docs = retriever.invoke(query)
                
                # Log success for debugging
                if docs:
                    logger.info(f"Retrieved {len(docs)} chunks for Chapter {chap_id}")
                else:
                    logger.debug(f"Zero docs for Chapter {chap_id} (Query: {query})")

                for d in docs:
                    all_contexts.append(f"[Source: Chapter {chap_id}]\n{d.page_content}")

            except Exception as e:
                logger.error(f"Retrieval error for chapter {chap_id}: {e}")

        # --- FIX 3: FALLBACK ---
        # If specific filters failed (maybe metadata is empty?), try global search for the topic name
        if not all_contexts:
            logger.warning(f"Strict chapter filtering failed for {q_type}. Retrying with global search...")
            try:
                global_query = " ".join([name for _, name in target_chapters]) + " " + str(q.get('llm_note', ''))
                global_docs = vectorstore.similarity_search(global_query, k=10)
                for d in global_docs:
                     all_contexts.append(f"[Source: Global Search]\n{d.page_content}")
            except Exception as e:
                logger.error(f"Global fallback failed: {e}")

        if not all_contexts:
            logger.error(f"CRITICAL: No context found for {q_type} even after fallback.")
            continue

        import random
        random.shuffle(all_contexts)
        combined_context = "\n\n".join(all_contexts)
        print(f"comibined_context: {combined_context}...")  

        # 3. Generate with DYNAMIC PROMPT
        try:
            subject = request_data.get("subject", "General")
            q_type = q.get("type", "Short Answer") 
            
            selected_prompt = get_prompt_template(subject, q_type)
            print(f"selected_prompt: {selected_prompt}")
            
            final_prompt = selected_prompt.format(
                context=combined_context,
                request_data=json.dumps(q, indent=2),
                question_type=q_type,
                num_of_questions=q.get("numQuestions", 0),
                
                # --- ADD THESE MISSING ARGUMENTS ---
                class_level=request_data.get("class", "Unknown"),  # Fixes KeyError: 'class_level'
                marks_per_question=q.get("marks", 1),              # Fixes potential KeyError: 'marks_per_question'
                # -----------------------------------
                
                format_instructions=parser.get_format_instructions()
            )
            
            response = llm.invoke(final_prompt)
            parsed = parser.parse(response.content)
            
            if isinstance(parsed, dict):
                exam_paper["sections"].append({
                    "sectionName": q.get("sectionName", ""),
                    "sectionTitle": parsed.get("sectionTitle", ""),
                    "description": parsed.get("description", ""),
                    "questions": parsed.get("questions", [])
                })
        except Exception as e:
            logger.error(f"Error generating section {q_type}: {e}")

    return exam_paper

def summarize_questions(llm, questions):
    """
    Summarize a list of questions into short conceptual summaries.
    
    Args:
        llm: LLM instance
        questions: List of question strings
    
    Returns:
        List of summary strings
    """
    if not questions:
        logger.debug("No questions provided for summarization")
        return []
    
    if not llm:
        logger.error("LLM instance is None")
        return []

    try:
        prompt = f"""
        Summarize the following questions into short one-line conceptual summaries 
        that capture what each question is testing (without copying exact phrasing).

        Questions:
        {json.dumps(questions, indent=2)}

        Return as a bullet list, no numbering, no extra text.
        """

        resp = llm.invoke(prompt)
        if not resp or not hasattr(resp, 'content'):
            logger.warning("Invalid LLM response for question summarization")
            return []
        
        lines = [line.strip("-• ").strip() for line in resp.content.split("\n") if line.strip()]
        logger.info(f"Generated {len(lines)} question summaries")
        return lines
    except Exception as e:
        logger.error(f"Summary generation failed: {e}", exc_info=True)
        return []

def generate_multiple_papers_with_summaries(request_data: dict, num_papers: int = 1, k: int = 10):
    """
    Generate multiple diverse question papers, using concept summaries to avoid repetition.
    
    Args:
        request_data: Dictionary containing exam request data
        num_papers: Number of papers to generate
        k: Number of chunks to retrieve
    
    Returns:
        List of exam paper dictionaries
    
    Raises:
        ValueError: If inputs are invalid
    """
    if not request_data or not isinstance(request_data, dict):
        raise ValueError("request_data must be a non-empty dictionary")
    
    if num_papers <= 0:
        raise ValueError("num_papers must be greater than 0")
    
    if k <= 0:
        raise ValueError("k must be greater than 0")
    
    logger.info(f"Generating {num_papers} diverse question papers")
    
    generated_papers = []
    previous_concept_summaries = []

    for paper_no in range(num_papers):
        try:
            logger.info(f"Generating Paper {paper_no + 1}/{num_papers}")

            # Create diversity hint
            if previous_concept_summaries:
                diversity_hint = (
                    "Avoid creating questions similar to these concepts:\n"
                    + "\n".join(previous_concept_summaries[-40:])
                )
            else:
                diversity_hint = "Create unique and diverse questions covering all given topics."

            # Clone request safely
            try:
                modified_request = deepcopy(request_data)
            except Exception as e:
                logger.error(f"Error cloning request data: {e}", exc_info=True)
                raise
            
            if "questions" not in modified_request:
                raise ValueError("request_data must contain 'questions' key")
            
            for q in modified_request["questions"]:
                if not isinstance(q, dict):
                    continue
                if "llm_note" in q and isinstance(q["llm_note"], list):
                    q["llm_note"].append(diversity_hint)
                else:
                    q["llm_note"] = [diversity_hint]

            # Generate one paper using your existing function
            try:
                paper = get_context_from_request(modified_request, k=k)
                if not paper or not isinstance(paper, dict):
                    logger.warning(f"Invalid paper generated for paper {paper_no + 1}")
                    continue
                generated_papers.append(paper)
            except Exception as e:
                logger.error(f"Error generating paper {paper_no + 1}: {e}", exc_info=True)
                continue

            # Extract questions for summarization
            all_questions = []
            for sec in paper.get("sections", []):
                if not isinstance(sec, dict):
                    continue
                for ques in sec.get("questions", []):
                    if isinstance(ques, dict):
                        question_text = ques.get("question", "")
                        if question_text:
                            all_questions.append(question_text)

            # Summarize to concept-level
            if all_questions:
                new_summaries = summarize_questions(llm, all_questions)
                previous_concept_summaries.extend(new_summaries)
                previous_concept_summaries = previous_concept_summaries[-100:]  # keep rolling window
        except Exception as e:
            logger.error(f"Unexpected error generating paper {paper_no + 1}: {e}", exc_info=True)
            continue

    logger.info(f"Successfully generated {len(generated_papers)}/{num_papers} papers")
    return generated_papers


# ---------- ✳️ ANSWER EVALUATION MODULE Functions ✳️ ----------
def extract_contents_from_pdf(file_path: str):
    """
    Extract all handwritten text (answers, names, roll numbers, etc.) from a student's handwritten answer sheet.
    """

    try:
        pages = convert_from_path(pdf_path=file_path,poppler_path=get_poppler_path()) 
    except Exception as e:
        logger.error(f"Error converting PDF to images: {e}")
        # Fallback for Windows local dev if needed, or re-raise
        raise RuntimeError(f"Could not convert PDF. Is Poppler installed? Error: {e}")

    #model = genai.genai.GenerativeModel(model_name="gemini-2.5-flash")
    model = genai.GenerativeModel("gemini-2.5-flash")

    # ✨ Carefully crafted prompt
    prompt = """
You are an OCR and handwriting recognition expert. 
You are given a scanned page from a student's handwritten answer sheet. 
Your goal is to extract **only** the handwritten content written by the student with maximum accuracy. 

### Extraction Rules:
1. Extract everything written by hand — including Name, Roll Number, Class, Subject, Question Numbers, and all Answers.
2. Preserve the **exact words, spellings, mathematical notations, symbols, and diagrams descriptions** as visible.
3. Do **not** skip crossed-out text; mention it as: (crossed out: "<text>")
4. Do **not** interpret or summarize — just transcribe exactly what is written.
5. Maintain natural line breaks and structure (use `\n` where new lines are visible).
6. Ignore printed templates, page numbers, logos, headers, or margins.
7. If handwriting is unclear or ambiguous, mark it as `[unclear]`.

### Output format:
Return plain text, no Markdown, no code blocks.
The format should look like:

------------------------------
Page 1 Text:
<exact handwritten transcription>

If multiple pages are provided, continue as:
------------------------------
Page 2 Text:
<text>
------------------------------
    """

    extracted_text = ""
    for page_num, page in enumerate(pages, start=1):
        try:
            # FIX: Use safe_gemini_generate instead of model.generate_content
            # This uses the new retry logic we just added
            response = safe_gemini_generate(model, [prompt, pil_to_part(page)])
            
            if response and response.candidates and response.candidates[0].content.parts:
                content = response.candidates[0].content.parts[0].text.strip()

                if content.startswith("```"):
                    content = content.strip("`").replace("json", "").strip()

                extracted_text += f"\n\n--- Page {page_num} ---\n{content}"
            else:
                logger.warning(f"Empty response for page {page_num}")

            # FIX: Add a small sleep to prevent hitting rate limits
            time.sleep(2) 

        except Exception as e:
            logger.error(f"Error processing page {page_num}: {e}")

    logger.info(f"Extracted {len(extracted_text)} characters from answer sheet.")
    return extracted_text


def assign_marks(question: str, correct_answer: str, student_answer: str, max_marks: int):
    """
    Uses Vertex AI (Gemini) to evaluate the student's handwritten answer and assign marks.
    """
    prompt = f"""
# You are a strict and fair examiner evaluating a student's handwritten answer sheet.

# Question: {question}
# Correct Answer: {correct_answer}
# Student's Handwritten Answer: {student_answer}

# ---

# ### EVALUATION OBJECTIVE:
# Evaluate the student's answer **exactly as a teacher would** in an academic examination.
# Be **objective, consistent, and proportional** — award marks only for correctness, relevance, and clarity.

# ---

# ### GENERAL RULES:
# 1. Award marks **out of {max_marks}**, proportionate to the question's demand and the quality of the answer.
# 2. Provide **partial marks** only when the answer shows partial understanding or relevant content.
# 3. If the answer is **blank/empty, irrelevant, or incorrect**, award **0 marks**.
# 4. **Grammar and spelling errors** matter for factual, MCQ, or fill-in-the-blank questions but are minor for 
# conceptual answers unless they change meaning.
# 5. Prioritize **accuracy, completeness, and understanding** over length.


# ---

# ### EVALUATION BY QUESTION TYPE:

# #### 🔸 Multiple Choice / One-word / Fill-in-the-Blank
# - Must be **exactly correct** and match the expected answer.
# - No partial credit unless question allows reasoning.
# - **Spelling errors** in factual terms lead to deduction.
# - If unclear, blank, or multiple conflicting responses → **0 marks**.

# #### 🔸 Short Answer Questions
# - Typically expect a **concise definition, explanation, or key fact**.
# - Evaluate based on:
#   - Presence of **main concept or keyword**.
#   - **Clarity and correctness** of supporting detail.
# - Award marks proportionally:
#   - Full marks → correct, clear, and complete explanation.
#   - Partial → key term present but lacks detail or precision.
#   - None → incorrect, vague, or irrelevant.

# #### 🔸 Reasoning / Definition / Medium-length Answers
# - Expect a **brief explanation, definition, or short reasoning**.
# - Evaluate for:
#   - **Understanding of concept**.
#   - **Supporting details or examples**.
#   - **Logical connection** between ideas.
# - Award marks according to depth:
#   - High marks → accurate, complete, logical, and relevant.
#   - Mid marks → mostly correct but missing depth or clarity.
#   - Low marks → partial understanding or incomplete logic.
#   - Zero → wrong or irrelevant.

# #### 🔸 Analytical / Long / Descriptive Answers
# - Expect **structured, multi-point, analytical or explanatory answers**.
# - Should include:
#   - **Introduction or definition**
#   - **Explanation or reasoning**
#   - **Examples, data, or implications**
# - Evaluate for:
#   - **Depth of understanding, Clarity**
#   - **Coverage of all key aspects**
# - Award marks proportionally:
#   - High marks → comprehensive, accurate, well-structured.
#   - Moderate marks → mostly correct but incomplete if examples are missing.
#   - Low marks → partial or shallow understanding.
#   - Zero → off-topic or factually wrong.

# ---

# ### BENCHMARK BY MARK RANGE (General Guidelines)
# - **1-2 marks:** Expect factual or conceptual recall (key terms, definitions, direct answers).
# - **3-4 marks:** Expect reasoning or short descriptive explanation showing conceptual understanding.
# - **5+ marks:** Expect analytical or explanatory depth, structured points, and relevant examples.
# ---

# ### FINAL OUTPUT FORMAT:
# Return ONLY valid JSON in this exact format:

# {{
#   "awarded_marks": <number>,
#   "remarks": "<short justification for the awarded marks>"
# }}
# """

    prompt = f"""
You are a strict, rule-bound examiner evaluating a student's handwritten answer sheet.

Question: {question}
Correct Answer: {correct_answer}
Student's Handwritten Answer: {student_answer}

---

### 🔥 OVERALL EVALUATION PRINCIPLE:
Award marks **only for what is explicitly written by the student**, not for what they “might have meant”.  
No assumptions. No generosity. No filling gaps.

---

## 🎯 MARKING RULES (STRICTER VERSION)

Note : if the student answer is Empty or Blank ( "" ) , award 0 marks. [ VERY VERY IMPORTANT ]

### 1. Zero-tolerance for missing required points  
- If the question demands **specific items** (e.g., “herders, farmers, merchants, kings”), the answer MUST explicitly mention them.  
- If even one required item is missing → deduct marks proportionally.

### 2. Blank / Irrelevant / Incorrect → **0 marks**
- Even partially related but off-target content = 0.
- If the student answers only half the question (e.g., only definition, no explanation) → heavy deductions.

### 3. No reward for general knowledge  
- Marks only for content aligning with the **correct answer or textbook context**.  
- Irrelevant extra information → **no marks**.

### 4. Partial marks only for:
- Clearly correct points **directly answering the question**.
- Each required point contributes a **fixed fraction** of the marks.
- Vague statements that don’t show clear understanding → **0**.

### 5. Specificity Required  
- General statements like “people lived differently” or “past was different for everyone” are NOT enough for 3+ mark questions.
- Examples, categories, and named items MUST appear for credit.

### 6. Structure Matters (for long answers)
Marks deducted for:
- Missing introduction
- Missing explanation
- Missing required examples
- No logical flow

### 7. Factual accuracy required  
- Wrong facts → zero marks for that portion.
- Spelling errors that change meaning → deduct marks.
- Minor spelling mistakes that do not change meaning → do not award but do not penalize heavily.

### 8. No marks for repetition or fluff  
- Rewriting the question in different words earns **no credit**.

---

## 📌 MARKING GUIDE BY QUESTION TYPE (STRICT)

### 🔸 **MCQ / One-word / Fill-in-the-Blank**
- **Must match EXACTLY** → full marks.
- Anything else → **0 marks**.
- No partial credit. No “near” answers.

---

### 🔸 **Short Answer (1–3 marks)**
Award marks ONLY if:
- The **key phrase/term** is exactly present.
- The explanation matches the correct answer.

Penalize:
- Missing keywords
- Vague explanation
- Off-topic examples
- Incorrect definitions

---

### 🔸 **Medium-length / Reasoning (3–4 marks)**
Expect:
- Clear definition + required explanation
- All required key points

Deductions for:
- Missing examples
- Missing second part of question
- Partial conceptual understanding
- Incomplete comparisons

---

### 🔸 **Long Answer / Analytical (5–6 marks)**
Expect:
- Intro / definition
- Explanation
- Examples or points explicitly present
- All subparts answered

If ANY required component missing:
- Deduct 1–2 marks immediately.

If multiple missing:
- Award very low marks or 0.

---

### ⭐ **MARK DISTRIBUTION RULE (very strict):**
For multi-point questions:
- Each correct explicit point = (max_marks / number_of_required_points)
- Missing point = 0 for that portion.
- Vague/generalised point = 0.

---

## ✔️ FINAL OUTPUT FORMAT
You MUST return ONLY valid JSON. No markdown, no code blocks, no explanations outside the JSON.

The maximum marks for this question is {max_marks}.

Return ONLY this JSON format (nothing else):

{{
  "awarded_marks": <number between 0 and {max_marks}>,
  "remarks": "<brief strict justification>"
}}

IMPORTANT: Return ONLY the JSON object, no other text before or after it.
"""

    try:
        # Use Vertex AI instead of Groq
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = safe_gemini_generate(model, [prompt])
        
        if not response:
            logger.warning("No response from Vertex AI for mark assignment")
            return {"awarded_marks": 0, "remarks": "Error: No response from AI"}
        
        if not response.candidates or len(response.candidates) == 0:
            logger.warning("No candidates in Vertex AI response")
            return {"awarded_marks": 0, "remarks": "Error: No candidates in response"}
        
        # Note: We'll check for content existence rather than finish_reason
        # as finish_reason enum values may vary between Vertex AI versions
        
        if not response.candidates[0].content.parts or len(response.candidates[0].content.parts) == 0:
            logger.warning("No content parts in Vertex AI response")
            return {"awarded_marks": 0, "remarks": "Error: No content parts in response"}
        
        raw = response.candidates[0].content.parts[0].text
        if not raw:
            logger.warning("Empty text in Vertex AI response")
            return {"awarded_marks": 0, "remarks": "Error: Empty text in response"}
        
        raw = raw.strip()
        logger.info(f"Raw Evaluation Output (first 500 chars): {raw[:500]}")

        # Try to parse JSON directly first
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict) and "awarded_marks" in parsed:
                return parsed
        except json.JSONDecodeError:
            pass
        
        # Handle cases where model adds extra text or markdown
        cleaned = raw
        
        # Remove markdown code blocks if present
        if "```json" in cleaned:
            cleaned = re.sub(r'```json\s*', '', cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r'```\s*$', '', cleaned, flags=re.MULTILINE)
        elif "```" in cleaned:
            cleaned = re.sub(r'```\s*', '', cleaned)
        
        # Remove any leading/trailing whitespace
        cleaned = cleaned.strip()
        
        # Try to extract JSON object using regex
        json_match = re.search(r'\{[\s\S]*\}', cleaned)
        if json_match:
            cleaned = json_match.group(0)
            try:
                parsed = json.loads(cleaned)
                if isinstance(parsed, dict) and "awarded_marks" in parsed:
                    return parsed
            except json.JSONDecodeError as e:
                logger.debug(f"JSON decode error after regex extraction: {e}")
                # Try to use clean_json_string helper
                try:
                    cleaned_json = clean_json_string(cleaned)
                    parsed = json.loads(cleaned_json)
                    if isinstance(parsed, dict) and "awarded_marks" in parsed:
                        return parsed
                except Exception as e2:
                    logger.debug(f"clean_json_string also failed: {e2}")
        
        # If still failing, try to find and extract just the JSON part more carefully
        # Look for the pattern: "awarded_marks": number
        marks_match = re.search(r'"awarded_marks"\s*:\s*(\d+)', cleaned)
        remarks_match = re.search(r'"remarks"\s*:\s*"([^"]*)"', cleaned)
        
        if marks_match:
            try:
                awarded_marks = int(marks_match.group(1))
                remarks = remarks_match.group(1) if remarks_match else "Parsed from partial response"
                logger.warning(f"Extracted partial JSON: awarded_marks={awarded_marks}")
                return {"awarded_marks": awarded_marks, "remarks": remarks}
            except:
                pass
        
        # Last resort: log the full response for debugging
        logger.error(f"Failed to parse JSON from response. Full response (first 1000 chars): {raw[:1000]}")
        logger.error(f"Cleaned response (first 1000 chars): {cleaned[:1000]}")
        return {"awarded_marks": 0, "remarks": f"Error: Could not parse JSON from AI response. Response length: {len(raw)} chars"}
            
    except Exception as e:
        logger.error(f"Error in assign_marks: {e}", exc_info=True)
        return {"awarded_marks": 0, "remarks": f"Error: {str(e)}"}

def retrieve_section_answers(section_title: str, questions: list, answer_paper: str):
    """
    Uses Vertex AI (Gemini) once per section to extract answers for all questions in that section.
    Returns a dict mapping question number → extracted answer.
    """
    questions_text = "\n".join(
        [f"{q['questionNo']}. {q['question']}" for q in questions]
    )

    prompt = f"""
You are a helpful assistant for exam evaluation.

Below is the student's **handwritten answer sheet text**:
---
{answer_paper}
---

Your task:
For each of the following {section_title} questions, extract the **exact handwritten answer** (include spelling mistakes, strikethroughs, etc. — do NOT fix them).

Questions:
{questions_text}

Return **only valid JSON**, in the following format:
{{
  "answers": [
    {{
      "questionNo": "1",
      "studentAnswer": "<exact handwritten answer>"
    }},
    {{
      "questionNo": "2",
      "studentAnswer": "<exact handwritten answer>"
    }}
  ]
}}
Nothing else should be printed.
"""

    try:
        # Use Vertex AI instead of Groq
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = safe_gemini_generate(model, [prompt,answer_paper]) #added answer_paper in the bracket
        
        if not response or not response.candidates or not response.candidates[0].content.parts:
            logger.warning("Empty response from Vertex AI for answer extraction")
            return {}
        
        text = response.candidates[0].content.parts[0].text.strip()

        # Handle possible cases where LLM wraps JSON in ```json ... ```
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            text = match.group(0)

        data = json.loads(text)
        return {a["questionNo"]: a["studentAnswer"] for a in data.get("answers", [])}

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON returned by Vertex AI. Full response:\n{text if 'text' in locals() else 'No response'}")
        return {}
    except Exception as e:
        logger.error(f"Error retrieving section answers: {e}", exc_info=True)
        return {}

def analyze_chapters_with_llm(report: dict):
    """
    Call LLM (Vertex AI) to compute chapter-wise totals and produce strengths/weaknesses/recommendations.
    Expects 'report' to contain per-question awarded marks.
    """
    # Build a compact per-question table for the LLM
    per_question_list = []
    for section in report.get("sections", []):
        for q in section.get("questions", []):
            per_question_list.append({
                "questionNo": q.get("questionNo"),
                # Handle both "chapterNo" (your new standard) and "chapter" (legacy/fallback)
                "chapterNo": q.get("chapterNo", q.get("chapter", "Unknown")),
                "marks": q.get("marks", 0),
                "awarded": q.get("awarded", 0),
                "studentAnswer": q.get("studentAnswer", "")
            })

    # Build prompt
    prompt = f"""
    You are an expert exam analyst. You will be given a student's evaluated question-level data.
    
    Your task:
    1) Group questions by 'chapterNo'.
    2) For EACH chapter, calculate:
       - totalMarks: sum of 'marks'
       - obtainedMarks: sum of 'awarded'
       - percentage: (obtainedMarks / totalMarks) * 100
    3) For EACH chapter, provide:
       - strengths: list (max 3) of topics/skills the student answered well.
       - weaknesses: list (max 4) of specific gaps where marks were lost.
       - recommendations: 1-2 specific actionable study tips.
    4) Produce an 'overall_summary' with:
       - strong_chapters: list of chapterNos with high percentages.
       - weak_chapters: list of chapterNos with low percentages.
       - study_plan: list of 3 bullet points for overall improvement.

    Input Data:
    {json.dumps(per_question_list, ensure_ascii=False, indent=2)}

    Output Format (Strict JSON):
    {{
      "chapters": [
        {{
          "chapterNo": "1",
          "totalMarks": 10,
          "obtainedMarks": 8,
          "percentage": 80.0,
          "strengths": ["..."],
          "weaknesses": ["..."],
          "recommendations": "..."
        }}
      ],
      "overall_summary": {{
        "strong_chapters": ["..."],
        "weak_chapters": ["..."],
        "study_plan": ["..."]
      }}
    }}
    """

    try:
        # Use your existing Vertex AI setup
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = safe_gemini_generate(model, [prompt])
        
        if not response or not response.candidates or not response.candidates[0].content.parts:
            logger.warning("No response from Vertex AI for chapter analysis")
            return {}

        text = response.candidates[0].content.parts[0].text.strip()
        
        # Clean up code blocks if present
        if "```" in text:
            text = re.sub(r"```(?:json)?|```", "", text).strip()

        # Parse JSON
        return json.loads(text)

    except Exception as e:
        logger.error(f"Chapter analysis failed: {e}", exc_info=True)
        # Return empty structure on failure so frontend doesn't break
        return {
            "chapters": [],
            "overall_summary": {
                "strong_chapters": [],
                "weak_chapters": [],
                "study_plan": []
            }
        }

def evaluate_answers(question_paper: dict, answer_paper: str, max_workers: int = 2): 
    """
    Evaluate student's handwritten answers with the official question paper.
    Uses multiprocessing for parallel evaluation of questions.
    
    Args:
        question_paper: Dictionary containing the question paper structure
        answer_paper: Extracted text from student's handwritten answer sheet
        max_workers: Maximum number of parallel workers for evaluation (default: 20)
    
    Returns:
        Dictionary containing evaluation results
    """
    result = []
    total_marks = 0
    obtained_marks = 0

    def evaluate_single_question(q, student_ans):
        """Helper function to evaluate a single question"""
        try:
            q_text = q['question']
            marks = q.get('marks', 0)
            correct_ans =q.get('correct answer') or q.get('correct_answer') or q.get('correctAnswer')
            
            # Evaluate marks using Vertex AI
            evaluation = assign_marks(q_text, correct_ans, student_ans, marks)
            
            logger.debug(f"Evaluation for Q{q['questionNo']}: {evaluation}")

            # Parse response safely
            try:
                eval_data = json.loads(evaluation) if isinstance(evaluation, str) else evaluation
                score = eval_data.get("awarded_marks", 0)
                remarks = eval_data.get("remarks", "")
            except Exception as e:
                logger.warning(f"Error parsing evaluation for Q{q['questionNo']}: {e}")
                score = 0
                remarks = "Invalid response format from AI"

            return {
                "questionNo": q['questionNo'],
                "question": q_text,
                "marks": marks,
                "chapterNo": q.get('chapterNo', q.get('chapter', 'Unknown')),
                "studentAnswer": student_ans,
                "correctAnswer": correct_ans,
                "awarded": score,
                "remarks": remarks
            }
        except Exception as e:
            logger.error(f"Error evaluating question {q.get('questionNo', 'unknown')}: {e}", exc_info=True)
            return {
                "questionNo": q.get('questionNo', ''),
                "question": q.get('question', ''),
                "marks": q.get('marks', 0),
                "chapterNo": q.get('chapterNo', 'Unknown'), # Ensure fallback
                "studentAnswer": student_ans,
                "correctAnswer": q.get('correct_answer', ''),
                "awarded": 0,
                "remarks": f"Error during evaluation: {str(e)}"
            }

    for section in question_paper['sections']:
        # FIX: Robustly get the title. Try 'sectionTitle', then 'sectionName', then 'title', then default.
        sec_title = section.get('sectionTitle') or section.get('sectionName') or section.get('title') or "Untitled Section"
        
        section_result = {"sectionTitle": sec_title, "questions": []}

        answers_map = retrieve_section_answers(
            sec_title, section.get('questions', []), answer_paper
        )

        logger.info(f"Answers Map for section '{sec_title}': {answers_map}")

        # ✅ Evaluate questions in parallel using ThreadPoolExecutor
        questions_to_evaluate = []
        for q in section.get('questions',[]):
            student_ans = answers_map.get(q['questionNo'], "")
            questions_to_evaluate.append((q, student_ans))
            total_marks += q.get('marks', 0)

        # Process questions in parallel
        if questions_to_evaluate:
            try:
                effective_workers = min(max_workers, len(questions_to_evaluate))
                with concurrent.futures.ThreadPoolExecutor(max_workers=effective_workers) as executor:
                    # Submit all evaluation tasks
                    futures = {
                        executor.submit(evaluate_single_question, q, student_ans): q
                        for q, student_ans in questions_to_evaluate
                    }
                    
                    # Collect results as they complete
                    evaluated_questions = []
                    for future in concurrent.futures.as_completed(futures):
                        try:
                            question_result = future.result()
                            evaluated_questions.append(question_result)
                            obtained_marks += question_result.get("awarded", 0)
                        except Exception as e:
                            q = futures.get(future, {})
                            logger.error(f"Error in future result for question {q.get('questionNo', 'unknown')}: {e}", exc_info=True)
                    
                    # Sort by question number to maintain order
                    evaluated_questions.sort(key=lambda x: x.get("questionNo", ""))
                    section_result['questions'] = evaluated_questions
                    
            except Exception as e:
                logger.error(f"Error in parallel evaluation for section '{section['sectionTitle']}': {e}", exc_info=True)
                # Fallback to sequential processing
                for q, student_ans in questions_to_evaluate:
                    question_result = evaluate_single_question(q, student_ans)
                    section_result['questions'].append(question_result)
                    obtained_marks += question_result.get("awarded", 0)

        result.append(section_result)

    #logger.info(f"Evaluation complete: {obtained_marks}/{total_marks} marks")
    #return {
    #    "Subject": question_paper["subject"],
    #    "Class": question_paper["className"],
    #    "totalMarks": total_marks,
    #    "obtainedMarks": obtained_marks,
    #    "sections": result
    #}
    # Base Report
    final_report = {
        "Subject": question_paper["subject"],
        "Class": question_paper["className"],
        "totalMarks": total_marks,
        "obtainedMarks": obtained_marks,
        "sections": result
    }

    # --- CHANGE 2: Run Chapter Analysis ---
    logger.info("Running chapter-wise analysis...")
    chapter_summary = analyze_chapters_with_llm(final_report)
    final_report["chapter_summary"] = chapter_summary
    # --------------------------------------

    logger.info(f"Evaluation complete: {obtained_marks}/{total_marks} marks")
    return final_report


# ---- Init LLM ----
def get_llm():
    """Initialize and return LLM instance"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    
    try:
        logger.info("Initializing ChatGroq LLM")
        llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=api_key)
        logger.info("LLM initialized successfully")
        return llm
    except Exception as e:
        logger.error(f"Failed to initialize LLM: {e}", exc_info=True)
        raise

try:
    llm = get_llm()
    parser = JsonOutputParser()
except Exception as e:
    logger.critical(f"Failed to initialize LLM or parser: {e}", exc_info=True)
    raise

QUESTION_PROMPT = PromptTemplate(
   input_variables=["context", "request_data", "question_type", "num_of_questions", "format_instructions"],
   template="""
You are a senior academic examiner. Generate a high-quality exam section based strictly on the provided textbook context.

### INPUT DATA
**Question Type:** {question_type}
**Number of Questions:** {num_of_questions}
**Context:** Contains extracts from specific chapters.

### STRICT GENERATION RULES

1. **CONTENT INTEGRITY:**
   - Use ONLY information from the [Source: Chapter X] blocks provided.
   - Do not use outside knowledge.
   - Ensure questions are distributed across ALL chapters present in the context.

2. **QUESTION QUALITY (Bloom's Taxonomy):**
   - **Knowledge (30%):** Recall facts, definitions, formulas (e.g., "Define...", "State the formula...").
   - **Understanding (40%):** Explain concepts (e.g., "Explain why...", "Distinguish between...").
   - **Application (30%):** Solve problems or analyze diagrams (e.g., "Calculate...", "Based on the diagram...").
   - *For Math:* Do not ask "What is the formula?". Give values and ask to *solve* using the formula.

3. **FORMATTING RULES (CRITICAL):**
   - **IF MCQ/Objective:**
     - Must provide `options` array with 4 distinct choices.
     - `correct_answer` must match one option text exactly.
   - **IF Subjective (Short/Long/Explain):**
     - `options` array MUST be empty `[]`.
     - `correct_answer` should be the model answer key (bullet points).
   - `chapterNo` MUST be extracted from the `[Source: Chapter X]` tag in the context.

### JSON OUTPUT SCHEMA
{format_instructions}

### SPECIFIC REQUEST DETAILS
{request_data}

### TEXTBOOK CONTEXT
{context}

GENERATE NOW. RETURN ONLY JSON.
"""
)

# Add this helper function after the imports section (around line 90)
def convert_content_to_string(content) -> str:
    """
    Convert content to string format for Document page_content.
    Handles strings, dictionaries (tables), lists, and other types.
    """
    if content is None:
        return ""
    
    if isinstance(content, str):
        return content
    
    if isinstance(content, dict):
        # Handle table structures or other dictionaries
        # Check if it's a table-like structure (has headers key)
        if "headers" in content:
            # It's a table - format it nicely
            headers = content.get("headers", [])
            rows = content.get("rows", [])
            data = content.get("data", [])
            
            # Create table representation
            table_lines = []
            
            # Format headers
            if headers:
                # Convert headers to strings and create header row
                header_strs = [str(h) for h in headers]
                table_lines.append(" | ".join(header_strs))
                # Create separator line
                separator_length = sum(len(h) for h in header_strs) + 3 * (len(header_strs) - 1)
                table_lines.append("-" * max(separator_length, 20))
            
            # Format rows (prefer 'rows' over 'data')
            rows_to_process = rows if rows else data
            if rows_to_process:
                for row in rows_to_process:
                    if isinstance(row, (list, tuple)):
                        # Ensure row has same number of columns as headers
                        row_cells = [str(cell) for cell in row]
                        # Pad or truncate to match header count
                        if headers and len(row_cells) != len(headers):
                            if len(row_cells) < len(headers):
                                row_cells.extend([""] * (len(headers) - len(row_cells)))
                            else:
                                row_cells = row_cells[:len(headers)]
                        table_lines.append(" | ".join(row_cells))
                    elif isinstance(row, dict):
                        # Row is a dictionary - try to extract values in header order
                        if headers:
                            row_values = [str(row.get(h, "")) for h in headers]
                            table_lines.append(" | ".join(row_values))
                        else:
                            table_lines.append(str(row))
                    else:
                        table_lines.append(str(row))
            
            # If no rows but we have headers, still return the table structure
            result = "\n".join(table_lines)
            return result if result.strip() else str(content)
        else:
            # General dictionary - convert to JSON-like string for better readability
            try:
                return json.dumps(content, ensure_ascii=False, indent=2)
            except Exception:
                # Fallback to string representation
                return str(content)
    
    if isinstance(content, (list, tuple)):
        # Convert list to readable format
        # If it's a list of lists, format as table
        if content and all(isinstance(item, (list, tuple)) for item in content):
            # It's a table-like structure (list of rows)
            table_lines = []
            for row in content:
                table_lines.append(" | ".join(str(cell) for cell in row))
            return "\n".join(table_lines)
        else:
            # Regular list - join with newlines
            return "\n".join(str(item) for item in content)
    
    # For any other type, convert to string
    return str(content)

def parse_xml_to_json(xml_text: str) -> dict:
    """
    Parse XML-like tagged blocks to JSON format.
    Handles both single page and multi-page formats.
    """
    if not xml_text:
        return {}
    
    try:
        # Remove any markdown code blocks if present
        xml_text = re.sub(r'```xml\s*', '', xml_text, flags=re.IGNORECASE)
        xml_text = re.sub(r'```\s*', '', xml_text)
        xml_text = xml_text.strip()
        
        # Try to parse as multi-page format first
        pages_pattern = r'<pages>(.*?)</pages>'
        pages_match = re.search(pages_pattern, xml_text, re.DOTALL | re.IGNORECASE)
        
        if pages_match:
            pages_content = pages_match.group(1)
            # Extract all page blocks
            page_pattern = r'<page\s+number=["\']?(\d+)["\']?\s*>(.*?)</page>'
            page_matches = re.finditer(page_pattern, pages_content, re.DOTALL | re.IGNORECASE)
            
            pages_list = []
            for page_match in page_matches:
                page_num = int(page_match.group(1))
                page_content = page_match.group(2)
                
                # Extract elements from this page
                elements = parse_elements_from_xml(page_content)
                if elements:
                    pages_list.append({
                        "page_number": page_num,
                        "elements": elements
                    })
            
            if pages_list:
                return {"pages": pages_list}
        
        # Try single page format (elements)
        elements_pattern = r'<elements>(.*?)</elements>'
        elements_match = re.search(elements_pattern, xml_text, re.DOTALL | re.IGNORECASE)
        
        if elements_match:
            elements_content = elements_match.group(1)
            elements = parse_elements_from_xml(elements_content)
            if elements:
                return {"elements": elements}
        
        # If no structured format found, try to extract any element tags directly
        elements = parse_elements_from_xml(xml_text)
        if elements:
            return {"elements": elements}
        
        return {}
    
    except Exception as e:
        logger.debug(f"Error parsing XML to JSON: {e}")
        return {}

def parse_elements_from_xml(xml_content: str) -> list:
    """
    Extract element tags from XML content.
    Handles CDATA sections and escaped content.
    """
    elements = []
    
    # Pattern to match element tags with optional CDATA
    element_pattern = r'<element\s+type=["\']([^"\']+)["\']\s*>(.*?)</element>'
    element_matches = re.finditer(element_pattern, xml_content, re.DOTALL | re.IGNORECASE)
    
    for match in element_matches:
        try:
            el_type = match.group(1).strip()
            el_content = match.group(2).strip()
            
            # Handle CDATA sections
            if el_content.startswith('<![CDATA[') and el_content.endswith(']]>'):
                el_content = el_content[9:-3]  # Remove CDATA wrapper
            
            # Clean up content (remove extra whitespace, decode entities if needed)
            el_content = re.sub(r'\s+', ' ', el_content).strip()
            
            # Basic HTML/XML entity decoding
            el_content = el_content.replace('&lt;', '<')
            el_content = el_content.replace('&gt;', '>')
            el_content = el_content.replace('&amp;', '&')
            el_content = el_content.replace('&quot;', '"')
            el_content = el_content.replace('&apos;', "'")
            
            if el_type and el_content:
                elements.append({
                    "type": el_type,
                    "content": el_content
                })
        except Exception as e:
            logger.debug(f"Error parsing element: {e}")
            continue
    
    return elements

def clean_json_string(text: str) -> str:
    """Clean JSON string by fixing common escape sequence issues - robust version"""
    if not text:
        return text
    
    # Remove markdown code blocks if present
    text = re.sub(r'```json\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'```\s*', '', text)
    
    # Process character by character to fix invalid escapes
    # Valid JSON escapes: \" \\ \/ \b \f \n \r \t \uXXXX
    result = []
    i = 0
    
    while i < len(text):
        if text[i] == '\\' and i + 1 < len(text):
            next_char = text[i + 1]
            # Check if it's a valid escape sequence
            if next_char in '"\\/bfnrt':
                # Valid single-character escape - keep as is
                result.append('\\' + next_char)
                i += 2
            elif next_char == 'u':
                # Check for valid unicode escape \uXXXX
                if i + 5 < len(text):
                    hex_part = text[i + 2:i + 6]
                    if len(hex_part) == 4 and all(c in '0123456789abcdefABCDEF' for c in hex_part):
                        # Valid unicode escape - keep as is
                        result.append(text[i:i + 6])
                        i += 6
                    else:
                        # Invalid unicode escape - output \\u
                        result.append('\\\\')
                        result.append('u')
                        i += 2
                else:
                    # Incomplete unicode escape - output \\u
                    result.append('\\\\')
                    result.append('u')
                    i += 2
            else:
                # Invalid escape sequence - output \\ + char
                result.append('\\\\')
                result.append(next_char)
                i += 2
        else:
            result.append(text[i])
            i += 1
    
    # Handle trailing backslash
    if i < len(text) and text[i] == '\\':
        result.append('\\\\')
    
    text = ''.join(result)
    
    # Fix trailing commas before closing braces/brackets
    text = re.sub(r',(\s*[}\]])', r'\1', text)
    
    # Fix unterminated strings by closing them at the end of JSON structure
    # This handles cases where quotes are missing at the end
    open_quotes = text.count('"') - text.count('\\"')
    if open_quotes % 2 != 0:
        # Odd number of quotes - likely unterminated string
        # Try to find and close the last unclosed string
        # Simple heuristic: if JSON ends without closing quote, add one before the closing brace
        if not text.rstrip().endswith('"') and text.rstrip().endswith('}'):
            # Find the last opening quote that's not closed
            last_quote_pos = text.rfind('"')
            if last_quote_pos > 0:
                # Check if there's content after the last quote
                after_quote = text[last_quote_pos + 1:].strip()
                if after_quote and not after_quote.startswith(','):
                    # Likely unterminated - try to fix by adding quote before closing brace
                    text = re.sub(r'([^"])\s*\}', r'\1"\}', text, count=1)
    
    # Note: Don't auto-fix commas here - let the error handler do it based on specific errors
    # Auto-fixing can break valid JSON
    
    return text

# ==============================================================================
#  The "Artist" Module: Visual Generation Logic
# ==============================================================================

def generate_svg_visual(prompt: str) -> Dict[str, str]:
    """
    Generates SVG code using a Gemini Text Model.
    Best for: Geometry, Graphs, Charts, Simple Diagrams.
    """
    try:
        model = genai.GenerativeModel("gemini-2.0-flash-exp") # Or gemini-1.5-flash
        
        svg_prompt = f"""
        You are a coding assistant. Write raw SVG code for the following educational diagram.
        
        Request: {prompt}
        
        Constraints:
        1. Output ONLY the <svg>...</svg> code. No markdown, no comments.
        2. Use a white background (fill="white" on a rect).
        3. Make lines black (stroke="black") and clearly visible.
        4. Add labels (text) if implied by the prompt.
        5. Keep it simple and clean. Size: 300x300.
        """
        
        response = safe_gemini_generate(model, [svg_prompt])
        if not response or not response.candidates:
            return None
            
        raw_text = response.candidates[0].content.parts[0].text
        # Clean markdown
        clean_svg = re.sub(r"```svg|```xml|```", "", raw_text).strip()
        
        # Verify it looks like SVG
        if "<svg" in clean_svg:
            return {"type": "svg", "content": clean_svg}
        return None

    except Exception as e:
        logger.error(f"SVG Generation failed: {e}")
        return None

def generate_realistic_image(prompt: str) -> Dict[str, str]:
    """
    Generates a realistic image using Gemini 2.5 Flash (Image Mode).
    """
    try:
        # 1. Initialize Client (using your specific project)
        # We initialize inside the function to ensure auth is ready when called
        PROJECT_ID = "gen-lang-client-0238295665"
        LOCATION = "global"
        client = genai_sdk.Client(
            vertexai=True,
            project=PROJECT_ID,
            location=LOCATION,
        )
        
        logger.info(f"🎨 Generating image with Gemini for prompt: '{prompt}'")

        # 2. Call the Model
        response = client.models.generate_content(
            model="gemini-2.5-flash-image", # Or "gemini-2.0-flash-exp" if 2.5 isn't available yet in your region
            contents=f"Draw an educational diagram, white background, clear visibility: {prompt}",
            config=GenerateContentConfig(
                response_modalities=["IMAGE"],
                candidate_count=1,
            ),
        )

        if response.candidates:
            for part in response.candidates[0].content.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    # Get raw bytes
                    img_bytes = part.inline_data.data
                    mime_type = part.inline_data.mime_type or "image/png"
                    
                    # Convert to Base64 string for frontend
                    b64_data = base64.b64encode(img_bytes).decode('utf-8')
                    
                    logger.info("✅ Image generated successfully via Google GenAI SDK")
                    return {"type": "image", "content": f"data:{mime_type};base64,{b64_data}"}

        logger.warning("⚠️ No image data found in Gemini response.")
        return generate_svg_visual(prompt) # Fallback to SVG

    except Exception as e:
        logger.error(f"❌ Image Generation failed: {e}")
        # Fallback to SVG so the user still sees something
        return generate_svg_visual(prompt)

def process_paper_visuals(exam_paper: Dict) -> Dict:
    """
    Iterates through the generated exam paper.
    If a question requires a visual, calls the 'Artist' to generate it.
    """
    logger.info("Processing Visuals for Exam Paper...")
    
    sections = exam_paper.get("sections", [])
    if not sections: return exam_paper

    total_visuals = 0
    
    # We can use ThreadPool to generate images in parallel for speed
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_map = {}
        
        for sec_idx, section in enumerate(sections):
            for q_idx, question in enumerate(section.get("questions", [])):
                vis_annot = question.get("visual_annotation")
                
                # Check if visual is required
                if vis_annot and vis_annot.get("required") is True:
                    prompt = vis_annot.get("prompt")
                    v_type = vis_annot.get("type", "svg")
                    
                    if prompt:
                        # Submit task
                        if v_type == "svg":
                            future = executor.submit(generate_svg_visual, prompt)
                        else:
                            future = executor.submit(generate_realistic_image, prompt)
                        
                        future_map[future] = (sec_idx, q_idx)
                        total_visuals += 1

        # Collect results
        for future in concurrent.futures.as_completed(future_map):
            sec_i, q_i = future_map[future]
            try:
                result = future.result()
                if result:
                    # Inject the generated visual into the question
                    # We create a clean "image_data" field for the frontend
                    sections[sec_i]["questions"][q_i]["image_data"] = result
                    logger.info(f"Visual generated for Q{q_i+1} (Section {sec_i+1})")
                else:
                    logger.warning(f"Visual generation failed for Q{q_i+1}")
            except Exception as e:
                logger.error(f"Error in visual worker: {e}")

    logger.info(f"Visual processing complete. Generated {total_visuals} visuals.")
    return exam_paper

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- API Endpoints ----
@app.post("/process_pdf/")
async def process_pdf_endpoint(file: UploadFile=Form(...), subject_data:str = Form(...)):
    """Process PDF and create FAISS index"""
    file_path = None
    try:
        # Validate file
        if not file or not file.filename:
            logger.error("No file provided in request")
            raise HTTPException(status_code=400, detail="No file provided")
        
        if not file.filename.lower().endswith('.pdf'):
            logger.error(f"Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        logger.info(f"Processing PDF: {file.filename}")
        
        # Save file locally (use /tmp for writable dir in HF)
        #file_path = f"/tmp/temp_{file.filename}"
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, f"temp_{file.filename}")
        try:
            content = await file.read()
            if not content:
                raise HTTPException(status_code=400, detail="Uploaded file is empty")
            
            with open(file_path, "wb") as f:
                f.write(content)
            logger.info(f"File saved temporarily: {file_path}")
        except Exception as e:
            logger.error(f"Error saving uploaded file: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")

        # Parse subject_data string into dict
        try:
            subject_data_dict = json.loads(subject_data)
            if not isinstance(subject_data_dict, dict):
                raise ValueError("subject_data must be a valid JSON object")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in subject_data: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON in subject_data: {str(e)}")
        except Exception as e:
            logger.error(f"Error parsing subject_data: {e}")
            raise HTTPException(status_code=400, detail=f"Error parsing subject_data: {str(e)}")

        # Process PDF into documents
        try:
            chapters, chunks = process_pdf(subject_data_dict, file_path)
        except FileNotFoundError as e:
            logger.error(f"PDF file not found: {e}")
            raise HTTPException(status_code=404, detail=f"PDF file not found: {str(e)}")
        except ValueError as e:
            logger.error(f"Invalid input: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing PDF: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

        if not chunks:
            logger.warning("No text chunks were created from PDF")
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "No text chunks were created. Likely due to Gemini API rate limits or empty PDF."
                }
            )

        # Create FAISS index
        try:
            logger.info(f"Creating vector store for {len(chunks)} new chunks")
            new_vectorstore = FAISS.from_documents(chunks, embeddings)
            
            # CHECK: Does an index already exist?
            if os.path.exists(INDEX_DIR):
                try:
                    logger.info(f"Loading existing FAISS index from {INDEX_DIR}")
                    existing_vectorstore = FAISS.load_local(
                        INDEX_DIR, 
                        embeddings, 
                        allow_dangerous_deserialization=True
                    )
                    
                    # MERGE the new book into the existing index
                    logger.info("Merging new content into existing index...")
                    existing_vectorstore.merge_from(new_vectorstore)
                    
                    # Save the combined index
                    existing_vectorstore.save_local(INDEX_DIR)
                    logger.info(f"Merged and saved FAISS index to {INDEX_DIR}")
                    
                except Exception as e:
                    logger.error(f"Error merging index: {e}. Falling back to overwriting.")
                    # Fallback: If loading fails, save the new one as the master
                    new_vectorstore.save_local(INDEX_DIR)
            else:
                # No existing index, just save the new one
                logger.info("No existing index found. Creating new one.")
                os.makedirs(INDEX_DIR, exist_ok=True)
                new_vectorstore.save_local(INDEX_DIR)
                logger.info(f"FAISS index saved to {INDEX_DIR}")

            # ---- START NEW CODE: UPLOAD TO HUGGING FACE ----
            repo_id = os.environ.get("DATASET_REPO_ID")
            hf_token = os.environ.get("HF_TOKEN")
            
            if repo_id and hf_token:
                logger.info(f"Attempting to upload index to HF Dataset: {repo_id}")
                try:
                    api = HfApi()
                    api.upload_folder(
                        folder_path=INDEX_DIR,
                        repo_id=repo_id,
                        repo_type="dataset",
                        token=hf_token,
                        commit_message="Update FAISS index"
                    )
                    logger.info("Successfully uploaded index to Hugging Face Dataset.")
                except Exception as e:
                    logger.error(f"Failed to upload index to Hub: {e}", exc_info=True)
            else:
                logger.warning("DATASET_REPO_ID or HF_TOKEN not set. Skipping index upload.")
            # ---- END NEW CODE ----

        except Exception as e:
            logger.error(f"Error creating FAISS index: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error creating index: {str(e)}")

        logger.info(f"Successfully processed PDF: {len(chunks)} chunks, {len(chapters)} chapters")
        return {
            "status": "success", 
            "chunks": len(chunks),
            "chapters": chapters
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in process_pdf_endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        # Clean up temporary file
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.debug(f"Cleaned up temporary file: {file_path}")
            except Exception as e:
                logger.warning(f"Error removing temporary file {file_path}: {e}")

@app.post("/generate_question_paper/")
async def generate_question_paper(request_data: dict = Body(...)):
    """Generate question paper from processed PDF with VISUALS"""
    try:
        # Validate request data
        if not request_data or not isinstance(request_data, dict):
            logger.error("Invalid request_data: not a dictionary")
            raise HTTPException(status_code=400, detail="request_data must be a valid dictionary")
        
        if "numberOfPapers" not in request_data:
            logger.error("Missing 'numberOfPapers' in request_data")
            raise HTTPException(status_code=400, detail="Missing required field: numberOfPapers")
        
        num_papers = request_data.get("numberOfPapers")
        
        # Check if FAISS index exists
        if not os.path.exists(INDEX_DIR):
            raise HTTPException(
                status_code=404, 
                detail="No PDF has been processed yet. Please process a PDF first."
            )
        
        # 1. Generate Text Content (The Architect)
        try:
            raw_papers = generate_multiple_papers_with_summaries(
                request_data, 
                num_papers, 
                k=10
            )
        except Exception as e:
            logger.error(f"Error generating text papers: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error generating papers: {str(e)}")

        if not raw_papers:
            raise HTTPException(status_code=500, detail="AI service did not return a valid array of papers.")

        # 2. Generate Visuals (The Artist) - NEW STEP
        final_papers = []
        for paper in raw_papers:
            # This injects 'image_data' into questions that need it
            enhanced_paper = process_paper_visuals(paper)
            final_papers.append(enhanced_paper)

        logger.info(f"Successfully generated {len(final_papers)} question paper(s)")
        return {
            "success": True,
            "question_paper": final_papers
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_question_paper: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Internal server error: {str(e)}"
            }
        )

@app.post("/evaluate_answer_paper/")
async def evaluate_answer_paper(
    file : UploadFile = Form(...),
    question_paper_str: str = Form(...),
):
    """
    Endpoint to evaluate a student's handwritten answers.
    Expects:
    - question_paper: full JSON of generated exam paper
    - answer_paper: extracted text from student's handwritten answer sheet
    """
    try:
        # Save file locally
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())

        try:
            question_paper = json.loads(question_paper_str)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON format in question_paper: {e}")

        extracted_answer_paper = extract_contents_from_pdf(file_path)
        if not extracted_answer_paper.strip():
            raise HTTPException(status_code=400, detail="Failed to extract text from the uploaded PDF file.")

        report = evaluate_answers(question_paper, extracted_answer_paper)
        logger.info(f"Evaluation successful for {file.filename}")
        print(report)

        # ✅ Optional: clean up temp file
        import os
        os.remove(file_path)
        return JSONResponse(content=report)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"CRITICAL ERROR in evaluate_answer_paper: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@app.get("/chunks/")
async def get_chunks(
    page: int = 1,
    page_size: int = 20,
    chapter_no: Optional[str] = None,
    subject: Optional[str] = None,
    className: Optional[str] = None
):
    """
    Retrieve chunks from the FAISS index with pagination and filtering.
    
    Query Parameters:
        page: Page number (default: 1)
        page_size: Number of chunks per page (default: 20, max: 100)
        chapter_no: Filter by chapter number (optional)
        subject: Filter by subject (optional)
        className: Filter by class name (optional)
    """
    try:
        # Validate inputs
        if page < 1:
            raise HTTPException(status_code=400, detail="page must be >= 1")
        
        if page_size < 1 or page_size > 100:
            raise HTTPException(status_code=400, detail="page_size must be between 1 and 100")
        
        # Check if FAISS index exists
        if not os.path.exists(INDEX_DIR):
            raise HTTPException(
                status_code=404,
                detail="No PDF has been processed yet. Please process a PDF first."
            )
        
        try:
            logger.info(f"Loading FAISS index from {INDEX_DIR}")
            vectorstore = FAISS.load_local(
                INDEX_DIR,
                embeddings,
                allow_dangerous_deserialization=True
            )
        except Exception as e:
            logger.error(f"Error loading FAISS index: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error loading index: {str(e)}")
        
        # Get all documents from the vector store
        try:
            # FAISS doesn't have a direct "get all" method, so we use similarity search with a generic query
            # This is a workaround - in production, you might want to store chunks separately
            all_docs = vectorstore.similarity_search("", k=10000)  # Large k to get all docs
            
            # Filter by metadata if provided
            filtered_docs = []
            for doc in all_docs:
                metadata = doc.metadata
                
                # Apply filters
                if chapter_no and metadata.get("chapter_no") != chapter_no:
                    continue
                if subject and metadata.get("subject") != subject:
                    continue
                if className and metadata.get("class") != className:
                    continue
                
                filtered_docs.append(doc)
            
            # Calculate pagination
            total_chunks = len(filtered_docs)
            total_pages = (total_chunks + page_size - 1) // page_size
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            
            # Get paginated chunks
            paginated_docs = filtered_docs[start_idx:end_idx]
            
            # Format response
            chunks_data = []
            for doc in paginated_docs:
                chunks_data.append({
                    "content": doc.page_content[:500] + "..." if len(doc.page_content) > 500 else doc.page_content,
                    "content_preview": doc.page_content[:200],
                    "metadata": {
                        "chapter_no": doc.metadata.get("chapter_no", ""),
                        "chapter_name": doc.metadata.get("chapter_name", ""),
                        "page": doc.metadata.get("page", 0),
                        "content_type": doc.metadata.get("content_type", ""),
                        "subject": doc.metadata.get("subject", ""),
                        "class": doc.metadata.get("class", ""),
                        "pdf_name": doc.metadata.get("pdf_name", ""),
                        "chunk_index": doc.metadata.get("chunk_index", None)
                    }
                })
            
            logger.info(f"Retrieved {len(paginated_docs)} chunks (page {page}/{total_pages})")
            
            return {
                "success": True,
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total_chunks": total_chunks,
                    "total_pages": total_pages,
                    "has_next": page < total_pages,
                    "has_prev": page > 1
                },
                "filters": {
                    "chapter_no": chapter_no,
                    "subject": subject,
                    "className": className
                },
                "chunks": chunks_data
            }
            
        except Exception as e:
            logger.error(f"Error retrieving chunks: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error retrieving chunks: {str(e)}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_chunks: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/chunks/stats/")
async def get_chunks_stats():
    """Get statistics about the chunks in the FAISS index"""
    try:
        if not os.path.exists(INDEX_DIR):
            raise HTTPException(
                status_code=404,
                detail="No PDF has been processed yet. Please process a PDF first."
            )
        
        try:
            vectorstore = FAISS.load_local(
                INDEX_DIR,
                embeddings,
                allow_dangerous_deserialization=True
            )
            all_docs = vectorstore.similarity_search("", k=10000)
        except Exception as e:
            logger.error(f"Error loading FAISS index: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error loading index: {str(e)}")
        
        # Collect statistics
        total_chunks = len(all_docs)
        chapters = {}
        subjects = set()
        classes = set()
        content_types = {}
        
        for doc in all_docs:
            metadata = doc.metadata
            
            # Chapter stats
            chapter_key = f"{metadata.get('chapter_no', 'Unknown')} - {metadata.get('chapter_name', 'Unknown')}"
            chapters[chapter_key] = chapters.get(chapter_key, 0) + 1
            
            # Subject and class
            if metadata.get("subject"):
                subjects.add(metadata.get("subject"))
            if metadata.get("class"):
                classes.add(metadata.get("class"))
            
            # Content type stats
            content_type = metadata.get("content_type", "unknown")
            content_types[content_type] = content_types.get(content_type, 0) + 1
        
        return {
            "success": True,
            "stats": {
                "total_chunks": total_chunks,
                "total_chapters": len(chapters),
                "chapters": chapters,
                "subjects": list(subjects),
                "classes": list(classes),
                "content_types": content_types
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chunks stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


class DeleteRequest(BaseModel):
    pdf_name: str

@app.delete("/delete_book/")
async def delete_book_from_index(request: DeleteRequest):
    """
    Delete all chunks associated with a specific PDF from the FAISS index.
    """
    pdf_name = request.pdf_name
    
    if not os.path.exists(INDEX_DIR):
        raise HTTPException(status_code=404, detail="FAISS index not found")

    try:
        # 1. Load the index
        vectorstore = FAISS.load_local(
            INDEX_DIR, 
            embeddings, 
            allow_dangerous_deserialization=True
        )
        
        # 2. Find IDs of chunks belonging to this PDF
        # LangChain's FAISS stores documents in .docstore._dict
        ids_to_delete = []
        for _id, doc in vectorstore.docstore._dict.items():
            if doc.metadata.get("pdf_name") == pdf_name:
                ids_to_delete.append(_id)
        
        if not ids_to_delete:
            return JSONResponse(content={"success": True, "message": "No chunks found for this book (already deleted?)"})

        # 3. Delete from Vector Store
        logger.info(f"Deleting {len(ids_to_delete)} chunks for {pdf_name}...")
        vectorstore.delete(ids_to_delete)
        
        # 4. Save updates to disk
        vectorstore.save_local(INDEX_DIR)
        
        # 5. (Optional) Re-upload to Hugging Face if configured
        repo_id = os.environ.get("DATASET_REPO_ID")
        hf_token = os.environ.get("HF_TOKEN")
        if repo_id and hf_token:
            try:
                api = HfApi()
                api.upload_folder(
                    folder_path=INDEX_DIR,
                    repo_id=repo_id,
                    repo_type="dataset",
                    token=hf_token,
                    commit_message=f"Deleted book: {pdf_name}"
                )
            except Exception as e:
                logger.error(f"Failed to sync deletion to HF: {e}")

        return {"success": True, "message": f"Deleted {len(ids_to_delete)} chunks."}

    except Exception as e:
        logger.error(f"Error deleting book from index: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete from index: {str(e)}")

@app.delete("/clear_index/")
async def clear_index():
    """Wipes the vector store completely. Use this to reset."""
    if os.path.exists(INDEX_DIR):
        import shutil
        shutil.rmtree(INDEX_DIR)
        return {"message": "Index deleted. Now re-upload your PfDF."}
    return {"message": "Index already empty."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)