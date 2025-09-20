import React, { useEffect, useState } from "react";

export default function ThresholdSlider() {
  const [review, setReview] = useState(0.7);
  const [reject, setReject] = useState(0.9);

  // Load current thresholds on mount
  useEffect(() => {
    fetch("/config")
      .then(res => res.json())
      .then(cfg => {
        setReview(cfg.review);
        setReject(cfg.reject);
      });
  }, []);

  const updateConfig = () => {
    fetch("/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review, reject })
    })
      .then(res => res.json())
      .then(cfg => {
        setReview(cfg.review);
        setReject(cfg.reject);
        alert("Thresholds updated!");
      });
  };

  return (
    <div className="rounded-lg border p-4 bg-white shadow">
      <h3 className="text-sm font-medium mb-2">Threshold Tuning</h3>

      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-600">
          Review Threshold ({review.toFixed(2)})
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={review}
          onChange={(e) => setReview(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-600">
          Reject Threshold ({reject.toFixed(2)})
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={reject}
          onChange={(e) => setReject(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <button
        onClick={updateConfig}
        className="rounded-md bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
      >
        Apply
      </button>
    </div>
  );
}
