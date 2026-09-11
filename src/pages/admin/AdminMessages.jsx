import { useState, useEffect } from 'react';
import { FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminApi from '../../utils/adminApi';
import { RevealStagger, RevealItem } from '../../components/ui/animations';
import { AdminMessagesSkeleton, PageSkeleton } from '../../components/ui/skeleton';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let ignore = false;
    adminApi.get(`/contact?page=${page}&limit=15`)
      .then(({ data }) => {
        if (!ignore) {
          setMessages(data.messages || []);
          setPages(data.pages || 1);
          setTotal(data.total || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          toast.error(err.response?.data?.message || 'Failed to load messages');
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [page]);

  if (loading) {
    return (
      <PageSkeleton label="Loading messages">
        <AdminMessagesSkeleton count={4} />
      </PageSkeleton>
    );
  }

  return (
    <>
      <p className="text-sm text-slate-500 mb-6">{total} message{total === 1 ? '' : 's'}</p>

      {messages.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-500">
          <FiMail className="mx-auto mb-3 text-slate-300" size={32} />
          No contact messages yet.
        </div>
      ) : (
        <RevealStagger className="space-y-4">
          {messages.map((m) => (
            <RevealItem key={m._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold text-slate-900">{m.subject || '(No subject)'}</p>
                  <p className="text-sm text-slate-500">
                    {m.name} · <a href={`mailto:${m.email}`} className="text-brand-blue hover:underline">{m.email}</a>
                  </p>
                </div>
                <span className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{m.message}</p>
            </RevealItem>
          ))}
        </RevealStagger>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-white">Prev</button>
          <span className="text-sm text-slate-500">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-white">Next</button>
        </div>
      )}
    </>
  );
};

export default AdminMessages;
