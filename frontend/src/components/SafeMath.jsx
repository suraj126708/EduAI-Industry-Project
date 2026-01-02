import React, { useEffect, useRef, useState } from "react";

const SafeMath = ({ latex }) => {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Fix common LaTeX typos and errors
  const fixLatexTypos = (text) => {
    if (!text) return text;

    let fixed = String(text);

    // Fix common typos: \rac → \frac (most common issue)
    fixed = fixed.replace(/\\rac\b/g, "\\frac");

    // Fix other common typos
    fixed = fixed.replace(/\\sqr\b/g, "\\sqrt"); // \sqr → \sqrt
    fixed = fixed.replace(/\\sqr\{/g, "\\sqrt{"); // \sqr{ → \sqrt{
    fixed = fixed.replace(/\\sqr\(/g, "\\sqrt("); // \sqr( → \sqrt(
    fixed = fixed.replace(/\\intg\b/g, "\\int"); // \intg → \int
    fixed = fixed.replace(/\\summ\b/g, "\\sum"); // \summ → \sum
    fixed = fixed.replace(/\\prodc\b/g, "\\prod"); // \prodc → \prod
    fixed = fixed.replace(/\\limt\b/g, "\\lim"); // \limt → \lim

    // Fix double backslashes that should be single
    fixed = fixed.replace(/\\\\frac/g, "\\frac");
    fixed = fixed.replace(/\\\\sqrt/g, "\\sqrt");
    fixed = fixed.replace(/\\\\rac/g, "\\frac");

    // Fix form-feed character issues (sometimes appears as \f in LaTeX)
    // Form-feed (0x0C) can appear as a single character before {, (, or [
    fixed = fixed.replace(/\u000c{/g, "\\frac{");
    fixed = fixed.replace(/\u000c\(/g, "\\frac(");
    fixed = fixed.replace(/\u000c\[/g, "\\frac[");

    // Fix cases where frac is missing backslash but is inside $ delimiters
    // Match: $frac{...}$ or $rac{...}$ and fix them
    fixed = fixed.replace(/\$rac\{/g, "$\\frac{");
    fixed = fixed.replace(/\$frac\{/g, "$\\frac{");

    // Fix cases in inline math: \(rac{...}\) or \(frac{...}\)
    fixed = fixed.replace(/\\\(rac\{/g, "\\(\\frac{");
    fixed = fixed.replace(/\\\(frac\{/g, "\\(\\frac{");

    // Fix cases in display math: \[rac{...}\] or \[frac{...}\]
    fixed = fixed.replace(/\\\[rac\{/g, "\\[\\frac{");
    fixed = fixed.replace(/\\\[frac\{/g, "\\[\\frac{");

    return fixed;
  };

  // Wait for MathJax to be fully loaded
  const waitForMathJax = (maxWait = 5000, interval = 100) => {
    return new Promise((resolve) => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        resolve(true);
        return;
      }

      let elapsed = 0;
      const checkInterval = setInterval(() => {
        elapsed += interval;
        if (window.MathJax && window.MathJax.typesetPromise) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (elapsed >= maxWait) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, interval);
    });
  };

  useEffect(() => {
    const attemptRender = async () => {
      // Reset failed state on new latex
      setFailed(false);
      setRetryCount(0);

      if (!ref.current || !latex) return;

      // Wait for MathJax to be available
      const mathJaxReady = await waitForMathJax();

      if (!mathJaxReady) {
        console.warn("MathJax not available, showing raw LaTeX");
        setFailed(true);
        return;
      }

      // Sanitize the LaTeX content
      let sanitizedLatex = String(latex || "")
        .replace(/\u000c/g, "\\") // form-feed → backslash
        .replace(/\u000b/g, "") // vertical tab
        .replace(/\u0000/g, "") // null character
        .trim();

      // Fix common LaTeX typos (like \rac → \frac)
      sanitizedLatex = fixLatexTypos(sanitizedLatex);

      if (!sanitizedLatex) {
        setFailed(true);
        return;
      }

      // Try rendering with retries
      const tryRender = async (attempt = 0) => {
        try {
          // Clear previous content
          if (ref.current) {
            ref.current.innerHTML = sanitizedLatex;
          }

          // Wait a bit for DOM to update
          await new Promise((resolve) => setTimeout(resolve, 50));

          // Attempt to typeset
          if (window.MathJax && window.MathJax.typesetPromise && ref.current) {
            await window.MathJax.typesetPromise([ref.current]);

            // Check if rendering actually worked by looking for MathJax elements
            const hasMathJaxElements =
              ref.current.querySelector("mjx-container");
            if (!hasMathJaxElements && attempt < maxRetries) {
              // No MathJax elements found, might need retry
              throw new Error("No MathJax elements rendered");
            }

            // Success - reset failed state
            setFailed(false);
            setRetryCount(0);
          }
        } catch (error) {
          console.warn(`MathJax render attempt ${attempt + 1} failed:`, error);

          if (attempt < maxRetries) {
            // Retry after a short delay
            setRetryCount(attempt + 1);
            setTimeout(() => tryRender(attempt + 1), 200 * (attempt + 1));
          } else {
            // All retries exhausted - show raw LaTeX
            console.warn(
              "All MathJax render attempts failed, showing raw LaTeX"
            );
            setFailed(true);
          }
        }
      };

      tryRender(0);
    };

    attemptRender();
  }, [latex]);

  // If rendering failed after all attempts, show raw LaTeX
  if (failed) {
    return (
      <span className="inline-block">
        <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded text-sm font-mono border border-gray-300">
          {String(latex || "").trim()}
        </code>
      </span>
    );
  }

  // Normal rendering - MathJax will process this
  return (
    <span ref={ref} className="inline-block">
      {latex}
    </span>
  );
};

export default SafeMath;
