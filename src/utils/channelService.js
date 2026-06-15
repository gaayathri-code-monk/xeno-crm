/**
 * channelService.js
 *
 * Simulates an async messaging channel provider.
 * The CRM calls `dispatch()` per message.
 * After random delays, this module fires receipt callbacks
 * back into the CRM — mimicking real delivery pipelines.
 */

let receiptHandler = null;

/** Register the CRM's receipt callback */
export function onReceipt(fn) {
  receiptHandler = fn;
}

/** Dispatch a single message through the stub channel */
export function dispatch(commId, channel) {
  const d1 = 500  + Math.random() * 1200;   // delivery delay
  const d2 = d1   + 500  + Math.random() * 2500;  // open delay
  const d3 = d2   + 400  + Math.random() * 3000;  // engage delay

  setTimeout(() => {
    const ok = Math.random() > 0.07;
    fire(commId, ok ? 'delivered' : 'failed', channel);

    if (ok) {
      setTimeout(() => {
        if (Math.random() > 0.42) {
          fire(commId, 'opened', channel);
          setTimeout(() => {
            if (Math.random() > 0.45) fire(commId, 'read',      channel);
            if (Math.random() > 0.55) fire(commId, 'clicked',   channel);
            if (Math.random() > 0.65) fire(commId, 'converted', channel);
          }, d3 - d2);
        }
      }, d2 - d1);
    }
  }, d1);
}

function fire(commId, status, channel) {
  if (receiptHandler) receiptHandler(commId, status, channel);
}
