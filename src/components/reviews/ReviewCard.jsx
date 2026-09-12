import { FiCheckCircle, FiEdit2 } from 'react-icons/fi';
import RatingStars from '../ui/RatingStars';

const ReviewCard = ({ review, onEdit }) => {
  if (!review) return null;

  const initial = review.avatarInitial || (review.name ? review.name.charAt(0).toUpperCase() : 'U');
  const dateFormatted = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        {/* Author Details */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-blue to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                {review.name}
              </p>
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-2 py-0.5 rounded-full">
                  <FiCheckCircle size={11} className="text-emerald-600" />
                  <span>Verified Purchase</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <RatingStars rating={review.rating} size={14} />
              {dateFormatted && (
                <span className="text-xs text-slate-400 font-medium">{dateFormatted}</span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button if allowed */}
        {review.canEdit && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(review)}
            className="text-xs font-semibold text-brand-blue hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
            aria-label="Edit review"
          >
            <FiEdit2 size={12} />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 leading-snug">
          {review.title}
        </h4>
      )}

      {/* Plain Text Comment */}
      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line break-words">
        {review.comment}
      </p>
    </div>
  );
};

export default ReviewCard;
