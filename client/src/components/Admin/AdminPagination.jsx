import React from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

/**
 * Standardized Admin Pagination Component
 * Displays 10 records per page by default with Previous/Next controls,
 * numbered page buttons with intelligent windowing, and accurate record bounds.
 */
const AdminPagination = ({
  page = 1,
  totalPages = 1,
  totalRecords = 0,
  limit = 10,
  onPageChange,
  itemName = "records",
}) => {
  if (totalRecords <= 0 && totalPages <= 1) return null;

  const startRecord = totalRecords > 0 ? (page - 1) * limit + 1 : 0;
  const endRecord = Math.min(page * limit, totalRecords);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page <= 4) {
        pages.push(2, 3, 4, 5, "...", totalPages);
      } else if (page >= totalPages - 3) {
        pages.push("...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push("...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="mz-admin-pagination" role="navigation" aria-label="Pagination">
      <div className="mz-admin-pagination-info">
        <span>
          Showing <strong>{startRecord}</strong> to <strong>{endRecord}</strong> of{" "}
          <strong>{Number(totalRecords).toLocaleString()}</strong> {itemName}
        </span>
      </div>

      <div className="mz-admin-pagination-controls">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="mz-admin-page-nav-btn"
          aria-label="Previous Page"
          title="Previous Page"
        >
          <LuChevronLeft style={{ width: 14, height: 14 }} />
          <span>Previous</span>
        </button>

        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="mz-admin-page-ellipsis">
                •••
              </span>
            );
          }
          const isCurrent = p === page;
          return (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange(p)}
              className={`mz-admin-page-number-btn ${isCurrent ? "active" : ""}`}
              aria-current={isCurrent ? "page" : undefined}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="mz-admin-page-nav-btn"
          aria-label="Next Page"
          title="Next Page"
        >
          <span>Next</span>
          <LuChevronRight style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
