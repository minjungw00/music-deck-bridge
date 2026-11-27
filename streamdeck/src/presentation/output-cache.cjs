'use strict';

// Serialize each field and coalesce newer values while a write is pending.
// A failed/skipped write stays unconfirmed and is retried on the next repaint.
function createOutputCache({ isCurrent }) {
  const entries = new WeakMap(), pending = new Set();
  function write(context, item, field, value, send, signature = value) {
    let fields = entries.get(item);
    if (!fields) { fields = new Map(); entries.set(item, fields); }
    let entry = fields.get(field);
    if (!entry) { entry = { confirmed: false }; fields.set(field, entry); }
    entry.desired = value;
    entry.desiredSignature = signature;
    function flush() {
      if (entry.pending || (entry.confirmed && entry.signature === entry.desiredSignature)) return;
      const sent = entry.desired;
      const sentSignature = entry.desiredSignature;
      const confirm = result => {
        entry.confirmed = result !== false;
        if (entry.confirmed) { entry.signature = sentSignature; item[field] = sent; }
      };
      let result;
      try { result = send(sent); }
      catch { entry.confirmed = false; return; }
      if (!result?.then) { confirm(result); return; }
      entry.pending = true;
      const operation = Promise.resolve(result).then(confirm, () => { entry.confirmed = false; }).then(() => {
        entry.pending = false;
        pending.delete(operation);
        if (entry.desiredSignature !== sentSignature && isCurrent(context, item)) flush();
      });
      pending.add(operation);
    }
    flush();
  }
  return { write, async settled() { while (pending.size) await Promise.all([...pending]); } };
}
module.exports = { createOutputCache };
