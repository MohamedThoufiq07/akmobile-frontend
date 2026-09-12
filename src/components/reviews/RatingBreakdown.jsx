import RatingStars from '../ui/RatingStars';

const RatingBreakdown = ({ distribution = {}, reviewCount = 0, averageRating = 0 }) => {
  const safeCount = Number(reviewCount) || 0;
  const safeAvg = Number(averageRating) || 0;

  const stars = [5, 4, 3, 2, 1];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 mb-8">
      {/* Overall Score */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left shrink-0 sm:pr-8 sm:border-r border-slate-200">
        <span className="text-5xl font-black text-slate-900 tracking-tight">
          {safeCount > 0 ? safeAvg.toFixed(1) : '0.0'}
        </span>
        <div className="mt-2">
          <RatingStars rating={safeAvg} size={22} />
        </div>
        <p className="text-xs font-semibold text-slate-500 mt-2 uppercase tracking-wider">
          Based on {safeCount} {safeCount === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Star Distribution Progress Bars */}
      <div className="flex-1 w-full space-y-2">
        {stars.map((star) => {
          const count = distribution[star] || 0;
          const percentage = safeCount > 0 ? Math.round((count / safeCount) * 100) : 0;

          return (
            <div key={star} className="flex items-center gap-3 text-xs sm:text-sm">
              <span className="w-12 font-medium text-slate-600 flex items-center gap-1 justify-end">
                <span>{star}</span>
                <span className="text-amber-400">★</span>
              </span>
              <div className="flex-1 h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <span className="w-10 text-right font-medium text-slate-500 tabular-nums">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingBreakdown;
