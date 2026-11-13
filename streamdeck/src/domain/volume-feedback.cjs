'use strict';
function validFeedbackSeconds(value) {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') return null;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 && seconds <= 3 ? Math.round(seconds * 10) / 10 : null;
}
function volumeFeedbackDuration(settings) {
  return Math.round((validFeedbackSeconds(settings?.volumeFeedbackSeconds) ?? 2) * 1000);
}
module.exports = { validFeedbackSeconds, volumeFeedbackDuration };
