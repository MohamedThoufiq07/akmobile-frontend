import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiStar, FiLoader } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

const ReviewModalDialog = ({
  onClose,
  onSubmit,
  initialData,
  productName,
  loading,
}) => {
  const isEdit = Boolean(initialData && initialData._id);

  const [rating, setRating] = useState(initialData?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(initialData?.title || '');
  const [comment, setComment] = useState(initialData?.comment || '');
  const [errors, setErrors] = useState({});

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  // Handle keyboard Escape and focus trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, onClose]);

  // Trap scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const validate = () => {
    const errs = {};
    if (!rating || rating < 1 || rating > 5) {
      errs.rating = 'Please select a star rating (1 to 5 stars).';
    }
    if (!comment.trim()) {
      errs.comment = 'Please write your review comments.';
    } else if (comment.trim().length > 2000) {
      errs.comment = 'Comment cannot exceed 2000 characters.';
    }
    if (title.trim().length > 200) {
      errs.title = 'Title cannot exceed 200 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    onSubmit({
      rating: Number(rating),
      title: title.trim(),
      comment: comment.trim(),
    });
  };

  const activeRating = hoverRating || rating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 id="review-modal-title" className="font-bold text-slate-900 text-lg sm:text-xl">
              {isEdit ? 'Edit Your Review' : 'Write a Verified Review'}
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm mt-0.5">
              {productName}
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close review dialog"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Star Rating Picker */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Overall Rating <span className="text-rose-500">*</span>
            </label>
            <div
              className="flex items-center gap-2"
              onMouseLeave={() => setHoverRating(0)}
              role="radiogroup"
              aria-label="Rating selector"
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= activeRating;
                return (
                  <button
                    key={star}
                    type="button"
                    disabled={loading}
                    ref={star === 1 ? firstInputRef : null}
                    onClick={() => {
                      setRating(star);
                      if (errors.rating) setErrors((prev) => ({ ...prev, rating: null }));
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    aria-label={`${star} out of 5 stars`}
                    className="p-1 rounded-md text-amber-400 hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
                  >
                    {isFilled ? (
                      <FaStar size={28} className="drop-shadow-sm text-amber-400" />
                    ) : (
                      <FiStar size={28} className="text-slate-300" />
                    )}
                  </button>
                );
              })}
              {rating > 0 && (
                <span className="text-xs font-semibold text-slate-600 ml-2">
                  {rating === 5 && 'Excellent'}
                  {rating === 4 && 'Good'}
                  {rating === 3 && 'Average'}
                  {rating === 2 && 'Below Average'}
                  {rating === 1 && 'Poor'}
                </span>
              )}
            </div>
            {errors.rating && (
              <p className="text-xs font-medium text-rose-500 mt-1.5" role="alert">
                {errors.rating}
              </p>
            )}
          </div>

          {/* Title Input (Optional) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="review-title" className="text-sm font-bold text-slate-800">
                Review Headline <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </label>
              <span className="text-xs text-slate-400 tabular-nums">{title.length}/200</span>
            </div>
            <input
              id="review-title"
              type="text"
              maxLength={200}
              disabled={loading}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
              }}
              placeholder="e.g. Excellent build quality and camera"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.title
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-brand-blue focus:ring-brand-blue/20'
              }`}
            />
            {errors.title && (
              <p className="text-xs font-medium text-rose-500 mt-1" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          {/* Comment Textarea (Required) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="review-comment" className="text-sm font-bold text-slate-800">
                Your Review <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400 tabular-nums">{comment.length}/2000</span>
            </div>
            <textarea
              id="review-comment"
              rows={4}
              maxLength={2000}
              disabled={loading}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (errors.comment) setErrors((prev) => ({ ...prev, comment: null }));
              }}
              placeholder="What did you like or dislike about this product? How was the performance?"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all resize-none ${
                errors.comment
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-brand-blue focus:ring-brand-blue/20'
              }`}
            />
            {errors.comment && (
              <p className="text-xs font-medium text-rose-500 mt-1" role="alert">
                {errors.comment}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blueDark text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading && <FiLoader size={16} className="animate-spin" />}
              <span>{isEdit ? 'Update Review' : 'Submit Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReviewFormModal = (props) => {
  if (!props.isOpen) return null;

  return createPortal(
    <ReviewModalDialog
      key={props.initialData?._id || 'new'}
      {...props}
    />,
    document.body
  );
};

export default ReviewFormModal;
