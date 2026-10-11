"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, PlusCircle, Trash2, Edit3, Save, Eye, ExternalLink, DownloadCloud, Sparkles } from "lucide-react";
import { subscribeToBlogs, saveBlog, deleteBlog, seedInitialBlogs } from "@/lib/firestore-service";
import { BlogArticle } from "@/lib/types";
import { slugify, formatDate } from "@/lib/utils";

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("E-Governance");
  const [author, setAuthor] = useState("NetDuniya Editorial");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published');

  useEffect(() => {
    const unsub = subscribeToBlogs((data) => setBlogs(data), false);
    return () => unsub();
  }, []);

  const openNew = () => {
    setEditId(null);
    setTitle("");
    setCategory("E-Governance");
    setAuthor("NetDuniya Editorial");
    setSummary("");
    setContent("");
    setImageUrl("");
    setStatus('published');
    setModalOpen(true);
  };

  const openEdit = (b: BlogArticle) => {
    setEditId(b.id);
    setTitle(b.title);
    setCategory(b.category);
    setAuthor(b.author);
    setSummary(b.summary);
    setContent(b.content);
    setImageUrl(b.imageUrl || "");
    setStatus(b.status);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const existing = editId ? blogs.find(b => b.id === editId) : null;
    const generatedSlug = slugify(title);
    const bObj: BlogArticle = {
      id: editId || `blog-${Date.now()}`,
      title: title.trim(),
      slug: generatedSlug || (existing?.slug || `blog-${Date.now()}`),
      category,
      author,
      summary,
      content,
      imageUrl: imageUrl.trim() || undefined,
      status,
      views: existing?.views || 0,
      publishedAt: existing?.publishedAt || Date.now(),
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await saveBlog(bObj);
    setModalOpen(false);
    setSuccessMsg("Article saved successfully! It is now live on the citizen portal.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleSeed = async () => {
    if (!confirm("Load default citizen guides into database?")) return;
    setSeeding(true);
    try {
      const count = await seedInitialBlogs();
      setSuccessMsg(`Successfully imported ${count} standard guides to database!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to import standard guides.");
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id: string, blogTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${blogTitle}"?`)) return;
    await deleteBlog(id);
    setSuccessMsg("Article deleted!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6 space-y-6">
      
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg flex items-center justify-between animate-fadeIn">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-600 font-bold hover:text-emerald-900">✕</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-black text-slate-900">Blog Articles & Guides CMS</h1>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              Live Real-Time Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Publish citizen knowledgebase guides, scheme explanations, and procedural announcements.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg border border-slate-300 flex items-center space-x-1.5 transition-colors"
            title="Import standard citizen guides into Firestore"
          >
            <DownloadCloud className="h-3.5 w-3.5" />
            <span>{seeding ? "Importing..." : "Seed Guides"}</span>
          </button>

          <button
            type="button"
            onClick={openNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow flex items-center space-x-1.5 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Create New Article</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Author</th>
              <th className="p-3">Published Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {blogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No blog articles found. Click "+ Create New Article" or "Seed Guides".
                </td>
              </tr>
            ) : (
              blogs.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900 max-w-xs truncate">{b.title}</td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {b.category}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{b.author}</td>
                  <td className="p-3 text-slate-500">{formatDate(b.publishedAt || b.createdAt)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-3 whitespace-nowrap">
                    <Link 
                      href={`/blog/${b.slug}`} 
                      target="_blank" 
                      className="text-slate-500 hover:text-brand-blue font-bold inline-flex items-center space-x-0.5"
                      title="View live page on User Portal"
                    >
                      <span>Live</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <button onClick={() => openEdit(b)} className="text-brand-blue font-bold hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(b.id, b.title)} className="text-rose-600 font-bold hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">{editId ? "Edit Article" : "Write New Blog Article"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Article Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. How to Link Aadhaar with PAN Card Online Step by Step"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Aadhaar Guides"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Featured Cover Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Summary / Excerpt *</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  required
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Article Content *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={8}
                  placeholder="Write the full guide, step by step instructions..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-sans"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-slate-700">Status:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="bg-slate-50 border border-slate-300 rounded p-1 text-xs font-bold"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg shadow"
                  >
                    Save Article
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
