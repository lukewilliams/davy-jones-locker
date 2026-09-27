// Runs a JavaScript node's code in a sandbox: a worker inside a hidden iframe
// with sandbox="allow-scripts". The iframe's origin is opaque, so the code
// can't reach this page, its storage or its cookies (a graph shared by
// someone else is as safe to run as your own); the worker keeps a long run
// off the page's thread; and removing the iframe stops the code when it runs
// too long.
//
// The code is the body of an async function whose parameters are the inputs
// (by name). console.log (and print) lines are collected; sleep(seconds)
// waits.

const TIMEOUT_SECONDS = 30

// Both functions run in the sandbox, from their source text, so they can't
// use anything outside themselves.
function worker() {
  const logs = []
  const show = (v) => {
    if (typeof v === 'string') return v
    try {
      return JSON.stringify(v) ?? String(v)
    } catch {
      return String(v)
    }
  }
  const log = (...args) => logs.push(args.map(show).join(' '))
  self.console = { log, info: log, warn: log, error: log, debug: log }
  self.print = log
  self.sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor

  self.onmessage = async ({ data: { code, inputs } }) => {
    let reply
    try {
      const names = Object.keys(inputs)
      const value = await new AsyncFunction(...names, code)(...names.map((n) => inputs[n]))
      reply = { value, logs }
    } catch (e) {
      reply = { error: String(e), logs }
    }
    try {
      self.postMessage(reply)
    } catch {
      self.postMessage({ error: "The code returned something that can't be passed out of it (like a function).", logs })
    }
  }
}

function frame(workerSource) {
  const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }))
  const w = new Worker(url)
  w.onmessage = (e) => parent.postMessage(e.data, '*')
  w.onerror = (e) => {
    e.preventDefault()
    parent.postMessage({ error: e.message, logs: [] }, '*')
  }
  window.addEventListener('message', (e) => {
    if (e.source === parent) w.postMessage(e.data)
  })
  parent.postMessage({ ready: true }, '*')
}

const SRCDOC = `<script>(${frame})(${JSON.stringify(`(${worker})()`)})</` + 'script>'

// Resolves to { value, logs }; rejects with an Error whose `logs` are the
// lines logged before it failed (or it was stopped).
export function runJavaScript(code, inputs, { timeoutSeconds = TIMEOUT_SECONDS } = {}) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.sandbox = 'allow-scripts'
    iframe.hidden = true
    iframe.srcdoc = SRCDOC

    const finish = (settle, value) => {
      clearTimeout(timer)
      window.removeEventListener('message', onMessage)
      iframe.remove() // and with it the worker
      settle(value)
    }
    const stopped = `Stopped after ${timeoutSeconds} ${timeoutSeconds === 1 ? 'second' : 'seconds'}.`
    const timer = setTimeout(() => finish(reject, Object.assign(new Error(stopped), { logs: [] })), timeoutSeconds * 1000)
    function onMessage(e) {
      if (e.source !== iframe.contentWindow) return
      if (e.data?.ready) return iframe.contentWindow.postMessage({ code, inputs }, '*')
      if (e.data?.error !== undefined) finish(reject, Object.assign(new Error(e.data.error), { logs: e.data.logs ?? [] }))
      else finish(resolve, e.data)
    }
    window.addEventListener('message', onMessage)
    document.body.append(iframe)
  })
}
