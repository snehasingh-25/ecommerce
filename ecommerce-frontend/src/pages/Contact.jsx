import { useState } from "react";
import { API } from "../api";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = async (e) => {
    e.preventDefault();
    await fetch(`${API}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    alert("Message sent!");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-16">
      <div className="px-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-10 border border-pink-200">
          <h2 className="text-3xl font-bold mb-8 text-pink-400 text-center">Contact Us 📩</h2>

          <form onSubmit={submit} className="space-y-6">
            <input
              className="w-full border-2 border-pink-200 rounded-lg p-4 focus:outline-none focus:border-pink-300"
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              type="email"
              className="w-full border-2 border-pink-200 rounded-lg p-4 focus:outline-none focus:border-pink-300"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />

            <textarea
              className="w-full border-2 border-pink-200 rounded-lg p-4 focus:outline-none focus:border-pink-300"
              placeholder="Message"
              rows="6"
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              required
            />

            <button
              type="submit"
              className="w-full bg-pink-300 text-gray-800 px-6 py-4 rounded-lg font-semibold hover:bg-pink-400 transition"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
