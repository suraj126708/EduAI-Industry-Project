import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const AdminUsers = () => {
  const { adminService } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    adminService.getUsers().then((res) => {
      if (res.success) setUsers(res.data.users || []);
    });
  }, [adminService]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">All Users</h2>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Role</th>
            <th className="border px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td className="border px-4 py-2" colSpan={4}>
                No users found.
              </td>
            </tr>
          )}
          {users.map((u) => (
            <tr key={u._id}>
              <td className="border px-4 py-2">{u.name}</td>
              <td className="border px-4 py-2">{u.email}</td>
              <td className="border px-4 py-2">{u.role}</td>
              <td className="border px-4 py-2">{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;
