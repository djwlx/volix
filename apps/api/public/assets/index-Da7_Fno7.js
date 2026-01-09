function sb(i, r) {
  for (var n = 0; n < r.length; n++) {
    const o = r[n];
    if (typeof o != 'string' && !Array.isArray(o)) {
      for (const a in o)
        if (a !== 'default' && !(a in i)) {
          const l = Object.getOwnPropertyDescriptor(o, a);
          l && Object.defineProperty(i, a, l.get ? l : { enumerable: !0, get: () => o[a] });
        }
    }
  }
  return Object.freeze(Object.defineProperty(i, Symbol.toStringTag, { value: 'Module' }));
}
(function () {
  const r = document.createElement('link').relList;
  if (r && r.supports && r.supports('modulepreload')) return;
  for (const a of document.querySelectorAll('link[rel="modulepreload"]')) o(a);
  new MutationObserver(a => {
    for (const l of a)
      if (l.type === 'childList')
        for (const c of l.addedNodes) c.tagName === 'LINK' && c.rel === 'modulepreload' && o(c);
  }).observe(document, { childList: !0, subtree: !0 });
  function n(a) {
    const l = {};
    return (
      a.integrity && (l.integrity = a.integrity),
      a.referrerPolicy && (l.referrerPolicy = a.referrerPolicy),
      a.crossOrigin === 'use-credentials'
        ? (l.credentials = 'include')
        : a.crossOrigin === 'anonymous'
        ? (l.credentials = 'omit')
        : (l.credentials = 'same-origin'),
      l
    );
  }
  function o(a) {
    if (a.ep) return;
    a.ep = !0;
    const l = n(a);
    fetch(a.href, l);
  }
})();
var Bs =
  typeof globalThis < 'u'
    ? globalThis
    : typeof window < 'u'
    ? window
    : typeof global < 'u'
    ? global
    : typeof self < 'u'
    ? self
    : {};
function ut(i) {
  return i && i.__esModule && Object.prototype.hasOwnProperty.call(i, 'default') ? i.default : i;
}
var ic = { exports: {} },
  ra = {},
  oc = { exports: {} },
  Ae = {};
var _y;
function lb() {
  if (_y) return Ae;
  _y = 1;
  var i = Symbol.for('react.element'),
    r = Symbol.for('react.portal'),
    n = Symbol.for('react.fragment'),
    o = Symbol.for('react.strict_mode'),
    a = Symbol.for('react.profiler'),
    l = Symbol.for('react.provider'),
    c = Symbol.for('react.context'),
    d = Symbol.for('react.forward_ref'),
    h = Symbol.for('react.suspense'),
    g = Symbol.for('react.memo'),
    y = Symbol.for('react.lazy'),
    w = Symbol.iterator;
  function S(k) {
    return k === null || typeof k != 'object'
      ? null
      : ((k = (w && k[w]) || k['@@iterator']), typeof k == 'function' ? k : null);
  }
  var _ = {
      isMounted: function () {
        return !1;
      },
      enqueueForceUpdate: function () {},
      enqueueReplaceState: function () {},
      enqueueSetState: function () {},
    },
    x = Object.assign,
    T = {};
  function O(k, K, le) {
    (this.props = k), (this.context = K), (this.refs = T), (this.updater = le || _);
  }
  (O.prototype.isReactComponent = {}),
    (O.prototype.setState = function (k, K) {
      if (typeof k != 'object' && typeof k != 'function' && k != null)
        throw Error(
          'setState(...): takes an object of state variables to update or a function which returns an object of state variables.'
        );
      this.updater.enqueueSetState(this, k, K, 'setState');
    }),
    (O.prototype.forceUpdate = function (k) {
      this.updater.enqueueForceUpdate(this, k, 'forceUpdate');
    });
  function L() {}
  L.prototype = O.prototype;
  function I(k, K, le) {
    (this.props = k), (this.context = K), (this.refs = T), (this.updater = le || _);
  }
  var $ = (I.prototype = new L());
  ($.constructor = I), x($, O.prototype), ($.isPureReactComponent = !0);
  var H = Array.isArray,
    V = Object.prototype.hasOwnProperty,
    F = { current: null },
    b = { key: !0, ref: !0, __self: !0, __source: !0 };
  function q(k, K, le) {
    var se,
      pe = {},
      Ce = null,
      Ne = null;
    if (K != null)
      for (se in (K.ref !== void 0 && (Ne = K.ref), K.key !== void 0 && (Ce = '' + K.key), K))
        V.call(K, se) && !b.hasOwnProperty(se) && (pe[se] = K[se]);
    var Re = arguments.length - 2;
    if (Re === 1) pe.children = le;
    else if (1 < Re) {
      for (var ke = Array(Re), Ze = 0; Ze < Re; Ze++) ke[Ze] = arguments[Ze + 2];
      pe.children = ke;
    }
    if (k && k.defaultProps) for (se in ((Re = k.defaultProps), Re)) pe[se] === void 0 && (pe[se] = Re[se]);
    return { $$typeof: i, type: k, key: Ce, ref: Ne, props: pe, _owner: F.current };
  }
  function W(k, K) {
    return { $$typeof: i, type: k.type, key: K, ref: k.ref, props: k.props, _owner: k._owner };
  }
  function X(k) {
    return typeof k == 'object' && k !== null && k.$$typeof === i;
  }
  function G(k) {
    var K = { '=': '=0', ':': '=2' };
    return (
      '$' +
      k.replace(/[=:]/g, function (le) {
        return K[le];
      })
    );
  }
  var oe = /\/+/g;
  function ie(k, K) {
    return typeof k == 'object' && k !== null && k.key != null ? G('' + k.key) : K.toString(36);
  }
  function fe(k, K, le, se, pe) {
    var Ce = typeof k;
    (Ce === 'undefined' || Ce === 'boolean') && (k = null);
    var Ne = !1;
    if (k === null) Ne = !0;
    else
      switch (Ce) {
        case 'string':
        case 'number':
          Ne = !0;
          break;
        case 'object':
          switch (k.$$typeof) {
            case i:
            case r:
              Ne = !0;
          }
      }
    if (Ne)
      return (
        (Ne = k),
        (pe = pe(Ne)),
        (k = se === '' ? '.' + ie(Ne, 0) : se),
        H(pe)
          ? ((le = ''),
            k != null && (le = k.replace(oe, '$&/') + '/'),
            fe(pe, K, le, '', function (Ze) {
              return Ze;
            }))
          : pe != null &&
            (X(pe) &&
              (pe = W(
                pe,
                le + (!pe.key || (Ne && Ne.key === pe.key) ? '' : ('' + pe.key).replace(oe, '$&/') + '/') + k
              )),
            K.push(pe)),
        1
      );
    if (((Ne = 0), (se = se === '' ? '.' : se + ':'), H(k)))
      for (var Re = 0; Re < k.length; Re++) {
        Ce = k[Re];
        var ke = se + ie(Ce, Re);
        Ne += fe(Ce, K, le, ke, pe);
      }
    else if (((ke = S(k)), typeof ke == 'function'))
      for (k = ke.call(k), Re = 0; !(Ce = k.next()).done; )
        (Ce = Ce.value), (ke = se + ie(Ce, Re++)), (Ne += fe(Ce, K, le, ke, pe));
    else if (Ce === 'object')
      throw (
        ((K = String(k)),
        Error(
          'Objects are not valid as a React child (found: ' +
            (K === '[object Object]' ? 'object with keys {' + Object.keys(k).join(', ') + '}' : K) +
            '). If you meant to render a collection of children, use an array instead.'
        ))
      );
    return Ne;
  }
  function me(k, K, le) {
    if (k == null) return k;
    var se = [],
      pe = 0;
    return (
      fe(k, se, '', '', function (Ce) {
        return K.call(le, Ce, pe++);
      }),
      se
    );
  }
  function be(k) {
    if (k._status === -1) {
      var K = k._result;
      (K = K()),
        K.then(
          function (le) {
            (k._status === 0 || k._status === -1) && ((k._status = 1), (k._result = le));
          },
          function (le) {
            (k._status === 0 || k._status === -1) && ((k._status = 2), (k._result = le));
          }
        ),
        k._status === -1 && ((k._status = 0), (k._result = K));
    }
    if (k._status === 1) return k._result.default;
    throw k._result;
  }
  var Te = { current: null },
    U = { transition: null },
    te = { ReactCurrentDispatcher: Te, ReactCurrentBatchConfig: U, ReactCurrentOwner: F };
  function ee() {
    throw Error('act(...) is not supported in production builds of React.');
  }
  return (
    (Ae.Children = {
      map: me,
      forEach: function (k, K, le) {
        me(
          k,
          function () {
            K.apply(this, arguments);
          },
          le
        );
      },
      count: function (k) {
        var K = 0;
        return (
          me(k, function () {
            K++;
          }),
          K
        );
      },
      toArray: function (k) {
        return (
          me(k, function (K) {
            return K;
          }) || []
        );
      },
      only: function (k) {
        if (!X(k)) throw Error('React.Children.only expected to receive a single React element child.');
        return k;
      },
    }),
    (Ae.Component = O),
    (Ae.Fragment = n),
    (Ae.Profiler = a),
    (Ae.PureComponent = I),
    (Ae.StrictMode = o),
    (Ae.Suspense = h),
    (Ae.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = te),
    (Ae.act = ee),
    (Ae.cloneElement = function (k, K, le) {
      if (k == null)
        throw Error('React.cloneElement(...): The argument must be a React element, but you passed ' + k + '.');
      var se = x({}, k.props),
        pe = k.key,
        Ce = k.ref,
        Ne = k._owner;
      if (K != null) {
        if (
          (K.ref !== void 0 && ((Ce = K.ref), (Ne = F.current)),
          K.key !== void 0 && (pe = '' + K.key),
          k.type && k.type.defaultProps)
        )
          var Re = k.type.defaultProps;
        for (ke in K)
          V.call(K, ke) && !b.hasOwnProperty(ke) && (se[ke] = K[ke] === void 0 && Re !== void 0 ? Re[ke] : K[ke]);
      }
      var ke = arguments.length - 2;
      if (ke === 1) se.children = le;
      else if (1 < ke) {
        Re = Array(ke);
        for (var Ze = 0; Ze < ke; Ze++) Re[Ze] = arguments[Ze + 2];
        se.children = Re;
      }
      return { $$typeof: i, type: k.type, key: pe, ref: Ce, props: se, _owner: Ne };
    }),
    (Ae.createContext = function (k) {
      return (
        (k = {
          $$typeof: c,
          _currentValue: k,
          _currentValue2: k,
          _threadCount: 0,
          Provider: null,
          Consumer: null,
          _defaultValue: null,
          _globalName: null,
        }),
        (k.Provider = { $$typeof: l, _context: k }),
        (k.Consumer = k)
      );
    }),
    (Ae.createElement = q),
    (Ae.createFactory = function (k) {
      var K = q.bind(null, k);
      return (K.type = k), K;
    }),
    (Ae.createRef = function () {
      return { current: null };
    }),
    (Ae.forwardRef = function (k) {
      return { $$typeof: d, render: k };
    }),
    (Ae.isValidElement = X),
    (Ae.lazy = function (k) {
      return { $$typeof: y, _payload: { _status: -1, _result: k }, _init: be };
    }),
    (Ae.memo = function (k, K) {
      return { $$typeof: g, type: k, compare: K === void 0 ? null : K };
    }),
    (Ae.startTransition = function (k) {
      var K = U.transition;
      U.transition = {};
      try {
        k();
      } finally {
        U.transition = K;
      }
    }),
    (Ae.unstable_act = ee),
    (Ae.useCallback = function (k, K) {
      return Te.current.useCallback(k, K);
    }),
    (Ae.useContext = function (k) {
      return Te.current.useContext(k);
    }),
    (Ae.useDebugValue = function () {}),
    (Ae.useDeferredValue = function (k) {
      return Te.current.useDeferredValue(k);
    }),
    (Ae.useEffect = function (k, K) {
      return Te.current.useEffect(k, K);
    }),
    (Ae.useId = function () {
      return Te.current.useId();
    }),
    (Ae.useImperativeHandle = function (k, K, le) {
      return Te.current.useImperativeHandle(k, K, le);
    }),
    (Ae.useInsertionEffect = function (k, K) {
      return Te.current.useInsertionEffect(k, K);
    }),
    (Ae.useLayoutEffect = function (k, K) {
      return Te.current.useLayoutEffect(k, K);
    }),
    (Ae.useMemo = function (k, K) {
      return Te.current.useMemo(k, K);
    }),
    (Ae.useReducer = function (k, K, le) {
      return Te.current.useReducer(k, K, le);
    }),
    (Ae.useRef = function (k) {
      return Te.current.useRef(k);
    }),
    (Ae.useState = function (k) {
      return Te.current.useState(k);
    }),
    (Ae.useSyncExternalStore = function (k, K, le) {
      return Te.current.useSyncExternalStore(k, K, le);
    }),
    (Ae.useTransition = function () {
      return Te.current.useTransition();
    }),
    (Ae.version = '18.3.1'),
    Ae
  );
}
var Sy;
function ch() {
  return Sy || ((Sy = 1), (oc.exports = lb())), oc.exports;
}
var Ey;
function ub() {
  if (Ey) return ra;
  Ey = 1;
  var i = ch(),
    r = Symbol.for('react.element'),
    n = Symbol.for('react.fragment'),
    o = Object.prototype.hasOwnProperty,
    a = i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
    l = { key: !0, ref: !0, __self: !0, __source: !0 };
  function c(d, h, g) {
    var y,
      w = {},
      S = null,
      _ = null;
    g !== void 0 && (S = '' + g), h.key !== void 0 && (S = '' + h.key), h.ref !== void 0 && (_ = h.ref);
    for (y in h) o.call(h, y) && !l.hasOwnProperty(y) && (w[y] = h[y]);
    if (d && d.defaultProps) for (y in ((h = d.defaultProps), h)) w[y] === void 0 && (w[y] = h[y]);
    return { $$typeof: r, type: d, key: S, ref: _, props: w, _owner: a.current };
  }
  return (ra.Fragment = n), (ra.jsx = c), (ra.jsxs = c), ra;
}
var by;
function cb() {
  return by || ((by = 1), (ic.exports = ub())), ic.exports;
}
var Zr = cb(),
  A = ch();
const E = ut(A),
  db = sb({ __proto__: null, default: E }, [A]);
var Us = {},
  ac = { exports: {} },
  rr = {},
  sc = { exports: {} },
  lc = {};
var Cy;
function fb() {
  return (
    Cy ||
      ((Cy = 1),
      (function (i) {
        function r(U, te) {
          var ee = U.length;
          U.push(te);
          e: for (; 0 < ee; ) {
            var k = (ee - 1) >>> 1,
              K = U[k];
            if (0 < a(K, te)) (U[k] = te), (U[ee] = K), (ee = k);
            else break e;
          }
        }
        function n(U) {
          return U.length === 0 ? null : U[0];
        }
        function o(U) {
          if (U.length === 0) return null;
          var te = U[0],
            ee = U.pop();
          if (ee !== te) {
            U[0] = ee;
            e: for (var k = 0, K = U.length, le = K >>> 1; k < le; ) {
              var se = 2 * (k + 1) - 1,
                pe = U[se],
                Ce = se + 1,
                Ne = U[Ce];
              if (0 > a(pe, ee))
                Ce < K && 0 > a(Ne, pe) ? ((U[k] = Ne), (U[Ce] = ee), (k = Ce)) : ((U[k] = pe), (U[se] = ee), (k = se));
              else if (Ce < K && 0 > a(Ne, ee)) (U[k] = Ne), (U[Ce] = ee), (k = Ce);
              else break e;
            }
          }
          return te;
        }
        function a(U, te) {
          var ee = U.sortIndex - te.sortIndex;
          return ee !== 0 ? ee : U.id - te.id;
        }
        if (typeof performance == 'object' && typeof performance.now == 'function') {
          var l = performance;
          i.unstable_now = function () {
            return l.now();
          };
        } else {
          var c = Date,
            d = c.now();
          i.unstable_now = function () {
            return c.now() - d;
          };
        }
        var h = [],
          g = [],
          y = 1,
          w = null,
          S = 3,
          _ = !1,
          x = !1,
          T = !1,
          O = typeof setTimeout == 'function' ? setTimeout : null,
          L = typeof clearTimeout == 'function' ? clearTimeout : null,
          I = typeof setImmediate < 'u' ? setImmediate : null;
        typeof navigator < 'u' &&
          navigator.scheduling !== void 0 &&
          navigator.scheduling.isInputPending !== void 0 &&
          navigator.scheduling.isInputPending.bind(navigator.scheduling);
        function $(U) {
          for (var te = n(g); te !== null; ) {
            if (te.callback === null) o(g);
            else if (te.startTime <= U) o(g), (te.sortIndex = te.expirationTime), r(h, te);
            else break;
            te = n(g);
          }
        }
        function H(U) {
          if (((T = !1), $(U), !x))
            if (n(h) !== null) (x = !0), be(V);
            else {
              var te = n(g);
              te !== null && Te(H, te.startTime - U);
            }
        }
        function V(U, te) {
          (x = !1), T && ((T = !1), L(q), (q = -1)), (_ = !0);
          var ee = S;
          try {
            for ($(te), w = n(h); w !== null && (!(w.expirationTime > te) || (U && !G())); ) {
              var k = w.callback;
              if (typeof k == 'function') {
                (w.callback = null), (S = w.priorityLevel);
                var K = k(w.expirationTime <= te);
                (te = i.unstable_now()), typeof K == 'function' ? (w.callback = K) : w === n(h) && o(h), $(te);
              } else o(h);
              w = n(h);
            }
            if (w !== null) var le = !0;
            else {
              var se = n(g);
              se !== null && Te(H, se.startTime - te), (le = !1);
            }
            return le;
          } finally {
            (w = null), (S = ee), (_ = !1);
          }
        }
        var F = !1,
          b = null,
          q = -1,
          W = 5,
          X = -1;
        function G() {
          return !(i.unstable_now() - X < W);
        }
        function oe() {
          if (b !== null) {
            var U = i.unstable_now();
            X = U;
            var te = !0;
            try {
              te = b(!0, U);
            } finally {
              te ? ie() : ((F = !1), (b = null));
            }
          } else F = !1;
        }
        var ie;
        if (typeof I == 'function')
          ie = function () {
            I(oe);
          };
        else if (typeof MessageChannel < 'u') {
          var fe = new MessageChannel(),
            me = fe.port2;
          (fe.port1.onmessage = oe),
            (ie = function () {
              me.postMessage(null);
            });
        } else
          ie = function () {
            O(oe, 0);
          };
        function be(U) {
          (b = U), F || ((F = !0), ie());
        }
        function Te(U, te) {
          q = O(function () {
            U(i.unstable_now());
          }, te);
        }
        (i.unstable_IdlePriority = 5),
          (i.unstable_ImmediatePriority = 1),
          (i.unstable_LowPriority = 4),
          (i.unstable_NormalPriority = 3),
          (i.unstable_Profiling = null),
          (i.unstable_UserBlockingPriority = 2),
          (i.unstable_cancelCallback = function (U) {
            U.callback = null;
          }),
          (i.unstable_continueExecution = function () {
            x || _ || ((x = !0), be(V));
          }),
          (i.unstable_forceFrameRate = function (U) {
            0 > U || 125 < U
              ? console.error(
                  'forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported'
                )
              : (W = 0 < U ? Math.floor(1e3 / U) : 5);
          }),
          (i.unstable_getCurrentPriorityLevel = function () {
            return S;
          }),
          (i.unstable_getFirstCallbackNode = function () {
            return n(h);
          }),
          (i.unstable_next = function (U) {
            switch (S) {
              case 1:
              case 2:
              case 3:
                var te = 3;
                break;
              default:
                te = S;
            }
            var ee = S;
            S = te;
            try {
              return U();
            } finally {
              S = ee;
            }
          }),
          (i.unstable_pauseExecution = function () {}),
          (i.unstable_requestPaint = function () {}),
          (i.unstable_runWithPriority = function (U, te) {
            switch (U) {
              case 1:
              case 2:
              case 3:
              case 4:
              case 5:
                break;
              default:
                U = 3;
            }
            var ee = S;
            S = U;
            try {
              return te();
            } finally {
              S = ee;
            }
          }),
          (i.unstable_scheduleCallback = function (U, te, ee) {
            var k = i.unstable_now();
            switch (
              (typeof ee == 'object' && ee !== null
                ? ((ee = ee.delay), (ee = typeof ee == 'number' && 0 < ee ? k + ee : k))
                : (ee = k),
              U)
            ) {
              case 1:
                var K = -1;
                break;
              case 2:
                K = 250;
                break;
              case 5:
                K = 1073741823;
                break;
              case 4:
                K = 1e4;
                break;
              default:
                K = 5e3;
            }
            return (
              (K = ee + K),
              (U = { id: y++, callback: te, priorityLevel: U, startTime: ee, expirationTime: K, sortIndex: -1 }),
              ee > k
                ? ((U.sortIndex = ee),
                  r(g, U),
                  n(h) === null && U === n(g) && (T ? (L(q), (q = -1)) : (T = !0), Te(H, ee - k)))
                : ((U.sortIndex = K), r(h, U), x || _ || ((x = !0), be(V))),
              U
            );
          }),
          (i.unstable_shouldYield = G),
          (i.unstable_wrapCallback = function (U) {
            var te = S;
            return function () {
              var ee = S;
              S = te;
              try {
                return U.apply(this, arguments);
              } finally {
                S = ee;
              }
            };
          });
      })(lc)),
    lc
  );
}
var Oy;
function pb() {
  return Oy || ((Oy = 1), (sc.exports = fb())), sc.exports;
}
var xy;
function hb() {
  if (xy) return rr;
  xy = 1;
  var i = ch(),
    r = pb();
  function n(e) {
    for (var t = 'https://reactjs.org/docs/error-decoder.html?invariant=' + e, s = 1; s < arguments.length; s++)
      t += '&args[]=' + encodeURIComponent(arguments[s]);
    return (
      'Minified React error #' +
      e +
      '; visit ' +
      t +
      ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
    );
  }
  var o = new Set(),
    a = {};
  function l(e, t) {
    c(e, t), c(e + 'Capture', t);
  }
  function c(e, t) {
    for (a[e] = t, e = 0; e < t.length; e++) o.add(t[e]);
  }
  var d = !(typeof window > 'u' || typeof window.document > 'u' || typeof window.document.createElement > 'u'),
    h = Object.prototype.hasOwnProperty,
    g =
      /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
    y = {},
    w = {};
  function S(e) {
    return h.call(w, e) ? !0 : h.call(y, e) ? !1 : g.test(e) ? (w[e] = !0) : ((y[e] = !0), !1);
  }
  function _(e, t, s, u) {
    if (s !== null && s.type === 0) return !1;
    switch (typeof t) {
      case 'function':
      case 'symbol':
        return !0;
      case 'boolean':
        return u
          ? !1
          : s !== null
          ? !s.acceptsBooleans
          : ((e = e.toLowerCase().slice(0, 5)), e !== 'data-' && e !== 'aria-');
      default:
        return !1;
    }
  }
  function x(e, t, s, u) {
    if (t === null || typeof t > 'u' || _(e, t, s, u)) return !0;
    if (u) return !1;
    if (s !== null)
      switch (s.type) {
        case 3:
          return !t;
        case 4:
          return t === !1;
        case 5:
          return isNaN(t);
        case 6:
          return isNaN(t) || 1 > t;
      }
    return !1;
  }
  function T(e, t, s, u, f, p, v) {
    (this.acceptsBooleans = t === 2 || t === 3 || t === 4),
      (this.attributeName = u),
      (this.attributeNamespace = f),
      (this.mustUseProperty = s),
      (this.propertyName = e),
      (this.type = t),
      (this.sanitizeURL = p),
      (this.removeEmptyString = v);
  }
  var O = {};
  'children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style'
    .split(' ')
    .forEach(function (e) {
      O[e] = new T(e, 0, !1, e, null, !1, !1);
    }),
    [
      ['acceptCharset', 'accept-charset'],
      ['className', 'class'],
      ['htmlFor', 'for'],
      ['httpEquiv', 'http-equiv'],
    ].forEach(function (e) {
      var t = e[0];
      O[t] = new T(t, 1, !1, e[1], null, !1, !1);
    }),
    ['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (e) {
      O[e] = new T(e, 2, !1, e.toLowerCase(), null, !1, !1);
    }),
    ['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(function (e) {
      O[e] = new T(e, 2, !1, e, null, !1, !1);
    }),
    'allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope'
      .split(' ')
      .forEach(function (e) {
        O[e] = new T(e, 3, !1, e.toLowerCase(), null, !1, !1);
      }),
    ['checked', 'multiple', 'muted', 'selected'].forEach(function (e) {
      O[e] = new T(e, 3, !0, e, null, !1, !1);
    }),
    ['capture', 'download'].forEach(function (e) {
      O[e] = new T(e, 4, !1, e, null, !1, !1);
    }),
    ['cols', 'rows', 'size', 'span'].forEach(function (e) {
      O[e] = new T(e, 6, !1, e, null, !1, !1);
    }),
    ['rowSpan', 'start'].forEach(function (e) {
      O[e] = new T(e, 5, !1, e.toLowerCase(), null, !1, !1);
    });
  var L = /[\-:]([a-z])/g;
  function I(e) {
    return e[1].toUpperCase();
  }
  'accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height'
    .split(' ')
    .forEach(function (e) {
      var t = e.replace(L, I);
      O[t] = new T(t, 1, !1, e, null, !1, !1);
    }),
    'xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type'.split(' ').forEach(function (e) {
      var t = e.replace(L, I);
      O[t] = new T(t, 1, !1, e, 'http://www.w3.org/1999/xlink', !1, !1);
    }),
    ['xml:base', 'xml:lang', 'xml:space'].forEach(function (e) {
      var t = e.replace(L, I);
      O[t] = new T(t, 1, !1, e, 'http://www.w3.org/XML/1998/namespace', !1, !1);
    }),
    ['tabIndex', 'crossOrigin'].forEach(function (e) {
      O[e] = new T(e, 1, !1, e.toLowerCase(), null, !1, !1);
    }),
    (O.xlinkHref = new T('xlinkHref', 1, !1, 'xlink:href', 'http://www.w3.org/1999/xlink', !0, !1)),
    ['src', 'href', 'action', 'formAction'].forEach(function (e) {
      O[e] = new T(e, 1, !1, e.toLowerCase(), null, !0, !0);
    });
  function $(e, t, s, u) {
    var f = O.hasOwnProperty(t) ? O[t] : null;
    (f !== null
      ? f.type !== 0
      : u || !(2 < t.length) || (t[0] !== 'o' && t[0] !== 'O') || (t[1] !== 'n' && t[1] !== 'N')) &&
      (x(t, s, f, u) && (s = null),
      u || f === null
        ? S(t) && (s === null ? e.removeAttribute(t) : e.setAttribute(t, '' + s))
        : f.mustUseProperty
        ? (e[f.propertyName] = s === null ? (f.type === 3 ? !1 : '') : s)
        : ((t = f.attributeName),
          (u = f.attributeNamespace),
          s === null
            ? e.removeAttribute(t)
            : ((f = f.type),
              (s = f === 3 || (f === 4 && s === !0) ? '' : '' + s),
              u ? e.setAttributeNS(u, t, s) : e.setAttribute(t, s))));
  }
  var H = i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    V = Symbol.for('react.element'),
    F = Symbol.for('react.portal'),
    b = Symbol.for('react.fragment'),
    q = Symbol.for('react.strict_mode'),
    W = Symbol.for('react.profiler'),
    X = Symbol.for('react.provider'),
    G = Symbol.for('react.context'),
    oe = Symbol.for('react.forward_ref'),
    ie = Symbol.for('react.suspense'),
    fe = Symbol.for('react.suspense_list'),
    me = Symbol.for('react.memo'),
    be = Symbol.for('react.lazy'),
    Te = Symbol.for('react.offscreen'),
    U = Symbol.iterator;
  function te(e) {
    return e === null || typeof e != 'object'
      ? null
      : ((e = (U && e[U]) || e['@@iterator']), typeof e == 'function' ? e : null);
  }
  var ee = Object.assign,
    k;
  function K(e) {
    if (k === void 0)
      try {
        throw Error();
      } catch (s) {
        var t = s.stack.trim().match(/\n( *(at )?)/);
        k = (t && t[1]) || '';
      }
    return (
      `
` +
      k +
      e
    );
  }
  var le = !1;
  function se(e, t) {
    if (!e || le) return '';
    le = !0;
    var s = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      if (t)
        if (
          ((t = function () {
            throw Error();
          }),
          Object.defineProperty(t.prototype, 'props', {
            set: function () {
              throw Error();
            },
          }),
          typeof Reflect == 'object' && Reflect.construct)
        ) {
          try {
            Reflect.construct(t, []);
          } catch (B) {
            var u = B;
          }
          Reflect.construct(e, [], t);
        } else {
          try {
            t.call();
          } catch (B) {
            u = B;
          }
          e.call(t.prototype);
        }
      else {
        try {
          throw Error();
        } catch (B) {
          u = B;
        }
        e();
      }
    } catch (B) {
      if (B && u && typeof B.stack == 'string') {
        for (
          var f = B.stack.split(`
`),
            p = u.stack.split(`
`),
            v = f.length - 1,
            C = p.length - 1;
          1 <= v && 0 <= C && f[v] !== p[C];

        )
          C--;
        for (; 1 <= v && 0 <= C; v--, C--)
          if (f[v] !== p[C]) {
            if (v !== 1 || C !== 1)
              do
                if ((v--, C--, 0 > C || f[v] !== p[C])) {
                  var R =
                    `
` + f[v].replace(' at new ', ' at ');
                  return e.displayName && R.includes('<anonymous>') && (R = R.replace('<anonymous>', e.displayName)), R;
                }
              while (1 <= v && 0 <= C);
            break;
          }
      }
    } finally {
      (le = !1), (Error.prepareStackTrace = s);
    }
    return (e = e ? e.displayName || e.name : '') ? K(e) : '';
  }
  function pe(e) {
    switch (e.tag) {
      case 5:
        return K(e.type);
      case 16:
        return K('Lazy');
      case 13:
        return K('Suspense');
      case 19:
        return K('SuspenseList');
      case 0:
      case 2:
      case 15:
        return (e = se(e.type, !1)), e;
      case 11:
        return (e = se(e.type.render, !1)), e;
      case 1:
        return (e = se(e.type, !0)), e;
      default:
        return '';
    }
  }
  function Ce(e) {
    if (e == null) return null;
    if (typeof e == 'function') return e.displayName || e.name || null;
    if (typeof e == 'string') return e;
    switch (e) {
      case b:
        return 'Fragment';
      case F:
        return 'Portal';
      case W:
        return 'Profiler';
      case q:
        return 'StrictMode';
      case ie:
        return 'Suspense';
      case fe:
        return 'SuspenseList';
    }
    if (typeof e == 'object')
      switch (e.$$typeof) {
        case G:
          return (e.displayName || 'Context') + '.Consumer';
        case X:
          return (e._context.displayName || 'Context') + '.Provider';
        case oe:
          var t = e.render;
          return (
            (e = e.displayName),
            e || ((e = t.displayName || t.name || ''), (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
            e
          );
        case me:
          return (t = e.displayName || null), t !== null ? t : Ce(e.type) || 'Memo';
        case be:
          (t = e._payload), (e = e._init);
          try {
            return Ce(e(t));
          } catch {}
      }
    return null;
  }
  function Ne(e) {
    var t = e.type;
    switch (e.tag) {
      case 24:
        return 'Cache';
      case 9:
        return (t.displayName || 'Context') + '.Consumer';
      case 10:
        return (t._context.displayName || 'Context') + '.Provider';
      case 18:
        return 'DehydratedFragment';
      case 11:
        return (
          (e = t.render),
          (e = e.displayName || e.name || ''),
          t.displayName || (e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')
        );
      case 7:
        return 'Fragment';
      case 5:
        return t;
      case 4:
        return 'Portal';
      case 3:
        return 'Root';
      case 6:
        return 'Text';
      case 16:
        return Ce(t);
      case 8:
        return t === q ? 'StrictMode' : 'Mode';
      case 22:
        return 'Offscreen';
      case 12:
        return 'Profiler';
      case 21:
        return 'Scope';
      case 13:
        return 'Suspense';
      case 19:
        return 'SuspenseList';
      case 25:
        return 'TracingMarker';
      case 1:
      case 0:
      case 17:
      case 2:
      case 14:
      case 15:
        if (typeof t == 'function') return t.displayName || t.name || null;
        if (typeof t == 'string') return t;
    }
    return null;
  }
  function Re(e) {
    switch (typeof e) {
      case 'boolean':
      case 'number':
      case 'string':
      case 'undefined':
        return e;
      case 'object':
        return e;
      default:
        return '';
    }
  }
  function ke(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === 'input' && (t === 'checkbox' || t === 'radio');
  }
  function Ze(e) {
    var t = ke(e) ? 'checked' : 'value',
      s = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
      u = '' + e[t];
    if (!e.hasOwnProperty(t) && typeof s < 'u' && typeof s.get == 'function' && typeof s.set == 'function') {
      var f = s.get,
        p = s.set;
      return (
        Object.defineProperty(e, t, {
          configurable: !0,
          get: function () {
            return f.call(this);
          },
          set: function (v) {
            (u = '' + v), p.call(this, v);
          },
        }),
        Object.defineProperty(e, t, { enumerable: s.enumerable }),
        {
          getValue: function () {
            return u;
          },
          setValue: function (v) {
            u = '' + v;
          },
          stopTracking: function () {
            (e._valueTracker = null), delete e[t];
          },
        }
      );
    }
  }
  function Xt(e) {
    e._valueTracker || (e._valueTracker = Ze(e));
  }
  function it(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var s = t.getValue(),
      u = '';
    return e && (u = ke(e) ? (e.checked ? 'true' : 'false') : e.value), (e = u), e !== s ? (t.setValue(e), !0) : !1;
  }
  function Bt(e) {
    if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  function Ur(e, t) {
    var s = t.checked;
    return ee({}, t, {
      defaultChecked: void 0,
      defaultValue: void 0,
      value: void 0,
      checked: s ?? e._wrapperState.initialChecked,
    });
  }
  function qe(e, t) {
    var s = t.defaultValue == null ? '' : t.defaultValue,
      u = t.checked != null ? t.checked : t.defaultChecked;
    (s = Re(t.value != null ? t.value : s)),
      (e._wrapperState = {
        initialChecked: u,
        initialValue: s,
        controlled: t.type === 'checkbox' || t.type === 'radio' ? t.checked != null : t.value != null,
      });
  }
  function Tt(e, t) {
    (t = t.checked), t != null && $(e, 'checked', t, !1);
  }
  function je(e, t) {
    Tt(e, t);
    var s = Re(t.value),
      u = t.type;
    if (s != null)
      u === 'number'
        ? ((s === 0 && e.value === '') || e.value != s) && (e.value = '' + s)
        : e.value !== '' + s && (e.value = '' + s);
    else if (u === 'submit' || u === 'reset') {
      e.removeAttribute('value');
      return;
    }
    t.hasOwnProperty('value')
      ? Ut(e, t.type, s)
      : t.hasOwnProperty('defaultValue') && Ut(e, t.type, Re(t.defaultValue)),
      t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
  }
  function or(e, t, s) {
    if (t.hasOwnProperty('value') || t.hasOwnProperty('defaultValue')) {
      var u = t.type;
      if (!((u !== 'submit' && u !== 'reset') || (t.value !== void 0 && t.value !== null))) return;
      (t = '' + e._wrapperState.initialValue), s || t === e.value || (e.value = t), (e.defaultValue = t);
    }
    (s = e.name),
      s !== '' && (e.name = ''),
      (e.defaultChecked = !!e._wrapperState.initialChecked),
      s !== '' && (e.name = s);
  }
  function Ut(e, t, s) {
    (t !== 'number' || Bt(e.ownerDocument) !== e) &&
      (s == null
        ? (e.defaultValue = '' + e._wrapperState.initialValue)
        : e.defaultValue !== '' + s && (e.defaultValue = '' + s));
  }
  var St = Array.isArray;
  function ct(e, t, s, u) {
    if (((e = e.options), t)) {
      t = {};
      for (var f = 0; f < s.length; f++) t['$' + s[f]] = !0;
      for (s = 0; s < e.length; s++)
        (f = t.hasOwnProperty('$' + e[s].value)),
          e[s].selected !== f && (e[s].selected = f),
          f && u && (e[s].defaultSelected = !0);
    } else {
      for (s = '' + Re(s), t = null, f = 0; f < e.length; f++) {
        if (e[f].value === s) {
          (e[f].selected = !0), u && (e[f].defaultSelected = !0);
          return;
        }
        t !== null || e[f].disabled || (t = e[f]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function Et(e, t) {
    if (t.dangerouslySetInnerHTML != null) throw Error(n(91));
    return ee({}, t, { value: void 0, defaultValue: void 0, children: '' + e._wrapperState.initialValue });
  }
  function ot(e, t) {
    var s = t.value;
    if (s == null) {
      if (((s = t.children), (t = t.defaultValue), s != null)) {
        if (t != null) throw Error(n(92));
        if (St(s)) {
          if (1 < s.length) throw Error(n(93));
          s = s[0];
        }
        t = s;
      }
      t == null && (t = ''), (s = t);
    }
    e._wrapperState = { initialValue: Re(s) };
  }
  function vt(e, t) {
    var s = Re(t.value),
      u = Re(t.defaultValue);
    s != null &&
      ((s = '' + s),
      s !== e.value && (e.value = s),
      t.defaultValue == null && e.defaultValue !== s && (e.defaultValue = s)),
      u != null && (e.defaultValue = '' + u);
  }
  function Rt(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue && t !== '' && t !== null && (e.value = t);
  }
  function Hr(e) {
    switch (e) {
      case 'svg':
        return 'http://www.w3.org/2000/svg';
      case 'math':
        return 'http://www.w3.org/1998/Math/MathML';
      default:
        return 'http://www.w3.org/1999/xhtml';
    }
  }
  function ar(e, t) {
    return e == null || e === 'http://www.w3.org/1999/xhtml'
      ? Hr(t)
      : e === 'http://www.w3.org/2000/svg' && t === 'foreignObject'
      ? 'http://www.w3.org/1999/xhtml'
      : e;
  }
  var Ye,
    mt = (function (e) {
      return typeof MSApp < 'u' && MSApp.execUnsafeLocalFunction
        ? function (t, s, u, f) {
            MSApp.execUnsafeLocalFunction(function () {
              return e(t, s, u, f);
            });
          }
        : e;
    })(function (e, t) {
      if (e.namespaceURI !== 'http://www.w3.org/2000/svg' || 'innerHTML' in e) e.innerHTML = t;
      else {
        for (
          Ye = Ye || document.createElement('div'),
            Ye.innerHTML = '<svg>' + t.valueOf().toString() + '</svg>',
            t = Ye.firstChild;
          e.firstChild;

        )
          e.removeChild(e.firstChild);
        for (; t.firstChild; ) e.appendChild(t.firstChild);
      }
    });
  function Ht(e, t) {
    if (t) {
      var s = e.firstChild;
      if (s && s === e.lastChild && s.nodeType === 3) {
        s.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var sr = {
      animationIterationCount: !0,
      aspectRatio: !0,
      borderImageOutset: !0,
      borderImageSlice: !0,
      borderImageWidth: !0,
      boxFlex: !0,
      boxFlexGroup: !0,
      boxOrdinalGroup: !0,
      columnCount: !0,
      columns: !0,
      flex: !0,
      flexGrow: !0,
      flexPositive: !0,
      flexShrink: !0,
      flexNegative: !0,
      flexOrder: !0,
      gridArea: !0,
      gridRow: !0,
      gridRowEnd: !0,
      gridRowSpan: !0,
      gridRowStart: !0,
      gridColumn: !0,
      gridColumnEnd: !0,
      gridColumnSpan: !0,
      gridColumnStart: !0,
      fontWeight: !0,
      lineClamp: !0,
      lineHeight: !0,
      opacity: !0,
      order: !0,
      orphans: !0,
      tabSize: !0,
      widows: !0,
      zIndex: !0,
      zoom: !0,
      fillOpacity: !0,
      floodOpacity: !0,
      stopOpacity: !0,
      strokeDasharray: !0,
      strokeDashoffset: !0,
      strokeMiterlimit: !0,
      strokeOpacity: !0,
      strokeWidth: !0,
    },
    mr = ['Webkit', 'ms', 'Moz', 'O'];
  Object.keys(sr).forEach(function (e) {
    mr.forEach(function (t) {
      (t = t + e.charAt(0).toUpperCase() + e.substring(1)), (sr[t] = sr[e]);
    });
  });
  function It(e, t, s) {
    return t == null || typeof t == 'boolean' || t === ''
      ? ''
      : s || typeof t != 'number' || t === 0 || (sr.hasOwnProperty(e) && sr[e])
      ? ('' + t).trim()
      : t + 'px';
  }
  function at(e, t) {
    e = e.style;
    for (var s in t)
      if (t.hasOwnProperty(s)) {
        var u = s.indexOf('--') === 0,
          f = It(s, t[s], u);
        s === 'float' && (s = 'cssFloat'), u ? e.setProperty(s, f) : (e[s] = f);
      }
  }
  var ti = ee(
    { menuitem: !0 },
    {
      area: !0,
      base: !0,
      br: !0,
      col: !0,
      embed: !0,
      hr: !0,
      img: !0,
      input: !0,
      keygen: !0,
      link: !0,
      meta: !0,
      param: !0,
      source: !0,
      track: !0,
      wbr: !0,
    }
  );
  function Ir(e, t) {
    if (t) {
      if (ti[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(n(137, e));
      if (t.dangerouslySetInnerHTML != null) {
        if (t.children != null) throw Error(n(60));
        if (typeof t.dangerouslySetInnerHTML != 'object' || !('__html' in t.dangerouslySetInnerHTML))
          throw Error(n(61));
      }
      if (t.style != null && typeof t.style != 'object') throw Error(n(62));
    }
  }
  function Nr(e, t) {
    if (e.indexOf('-') === -1) return typeof t.is == 'string';
    switch (e) {
      case 'annotation-xml':
      case 'color-profile':
      case 'font-face':
      case 'font-face-src':
      case 'font-face-uri':
      case 'font-face-format':
      case 'font-face-name':
      case 'missing-glyph':
        return !1;
      default:
        return !0;
    }
  }
  var on = null;
  function Kr(e) {
    return (
      (e = e.target || e.srcElement || window),
      e.correspondingUseElement && (e = e.correspondingUseElement),
      e.nodeType === 3 ? e.parentNode : e
    );
  }
  var gr = null,
    lr = null,
    Nt = null;
  function an(e) {
    if ((e = qo(e))) {
      if (typeof gr != 'function') throw Error(n(280));
      var t = e.stateNode;
      t && ((t = ns(t)), gr(e.stateNode, e.type, t));
    }
  }
  function yr(e) {
    lr ? (Nt ? Nt.push(e) : (Nt = [e])) : (lr = e);
  }
  function sn() {
    if (lr) {
      var e = lr,
        t = Nt;
      if (((Nt = lr = null), an(e), t)) for (e = 0; e < t.length; e++) an(t[e]);
    }
  }
  function bn(e, t) {
    return e(t);
  }
  function Vr() {}
  var Cn = !1;
  function Eo(e, t, s) {
    if (Cn) return e(t, s);
    Cn = !0;
    try {
      return bn(e, t, s);
    } finally {
      (Cn = !1), (lr !== null || Nt !== null) && (Vr(), sn());
    }
  }
  function ri(e, t) {
    var s = e.stateNode;
    if (s === null) return null;
    var u = ns(s);
    if (u === null) return null;
    s = u[t];
    e: switch (t) {
      case 'onClick':
      case 'onClickCapture':
      case 'onDoubleClick':
      case 'onDoubleClickCapture':
      case 'onMouseDown':
      case 'onMouseDownCapture':
      case 'onMouseMove':
      case 'onMouseMoveCapture':
      case 'onMouseUp':
      case 'onMouseUpCapture':
      case 'onMouseEnter':
        (u = !u.disabled) ||
          ((e = e.type), (u = !(e === 'button' || e === 'input' || e === 'select' || e === 'textarea'))),
          (e = !u);
        break e;
      default:
        e = !1;
    }
    if (e) return null;
    if (s && typeof s != 'function') throw Error(n(231, t, typeof s));
    return s;
  }
  var bo = !1;
  if (d)
    try {
      var P = {};
      Object.defineProperty(P, 'passive', {
        get: function () {
          bo = !0;
        },
      }),
        window.addEventListener('test', P, P),
        window.removeEventListener('test', P, P);
    } catch {
      bo = !1;
    }
  function j(e, t, s, u, f, p, v, C, R) {
    var B = Array.prototype.slice.call(arguments, 3);
    try {
      t.apply(s, B);
    } catch (Q) {
      this.onError(Q);
    }
  }
  var z = !1,
    Z = null,
    ne = !1,
    we = null,
    ue = {
      onError: function (e) {
        (z = !0), (Z = e);
      },
    };
  function ye(e, t, s, u, f, p, v, C, R) {
    (z = !1), (Z = null), j.apply(ue, arguments);
  }
  function Se(e, t, s, u, f, p, v, C, R) {
    if ((ye.apply(this, arguments), z)) {
      if (z) {
        var B = Z;
        (z = !1), (Z = null);
      } else throw Error(n(198));
      ne || ((ne = !0), (we = B));
    }
  }
  function ve(e) {
    var t = e,
      s = e;
    if (e.alternate) for (; t.return; ) t = t.return;
    else {
      e = t;
      do (t = e), (t.flags & 4098) !== 0 && (s = t.return), (e = t.return);
      while (e);
    }
    return t.tag === 3 ? s : null;
  }
  function Pe(e) {
    if (e.tag === 13) {
      var t = e.memoizedState;
      if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null)) return t.dehydrated;
    }
    return null;
  }
  function Ee(e) {
    if (ve(e) !== e) throw Error(n(188));
  }
  function $e(e) {
    var t = e.alternate;
    if (!t) {
      if (((t = ve(e)), t === null)) throw Error(n(188));
      return t !== e ? null : e;
    }
    for (var s = e, u = t; ; ) {
      var f = s.return;
      if (f === null) break;
      var p = f.alternate;
      if (p === null) {
        if (((u = f.return), u !== null)) {
          s = u;
          continue;
        }
        break;
      }
      if (f.child === p.child) {
        for (p = f.child; p; ) {
          if (p === s) return Ee(f), e;
          if (p === u) return Ee(f), t;
          p = p.sibling;
        }
        throw Error(n(188));
      }
      if (s.return !== u.return) (s = f), (u = p);
      else {
        for (var v = !1, C = f.child; C; ) {
          if (C === s) {
            (v = !0), (s = f), (u = p);
            break;
          }
          if (C === u) {
            (v = !0), (u = f), (s = p);
            break;
          }
          C = C.sibling;
        }
        if (!v) {
          for (C = p.child; C; ) {
            if (C === s) {
              (v = !0), (s = p), (u = f);
              break;
            }
            if (C === u) {
              (v = !0), (u = p), (s = f);
              break;
            }
            C = C.sibling;
          }
          if (!v) throw Error(n(189));
        }
      }
      if (s.alternate !== u) throw Error(n(190));
    }
    if (s.tag !== 3) throw Error(n(188));
    return s.stateNode.current === s ? e : t;
  }
  function Me(e) {
    return (e = $e(e)), e !== null ? gt(e) : null;
  }
  function gt(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
      var t = gt(e);
      if (t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var ft = r.unstable_scheduleCallback,
    bt = r.unstable_cancelCallback,
    Ke = r.unstable_shouldYield,
    Yt = r.unstable_requestPaint,
    Ve = r.unstable_now,
    ni = r.unstable_getCurrentPriorityLevel,
    vr = r.unstable_ImmediatePriority,
    ur = r.unstable_UserBlockingPriority,
    On = r.unstable_NormalPriority,
    ii = r.unstable_LowPriority,
    Wr = r.unstable_IdlePriority,
    ln = null,
    Kt = null;
  function Fe(e) {
    if (Kt && typeof Kt.onCommitFiberRoot == 'function')
      try {
        Kt.onCommitFiberRoot(ln, e, void 0, (e.current.flags & 128) === 128);
      } catch {}
  }
  var Xe = Math.clz32 ? Math.clz32 : tt,
    xn = Math.log,
    un = Math.LN2;
  function tt(e) {
    return (e >>>= 0), e === 0 ? 32 : (31 - ((xn(e) / un) | 0)) | 0;
  }
  var cn = 64,
    oi = 4194304;
  function ai(e) {
    switch (e & -e) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e & 4194240;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return e & 130023424;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 1073741824;
      default:
        return e;
    }
  }
  function qa(e, t) {
    var s = e.pendingLanes;
    if (s === 0) return 0;
    var u = 0,
      f = e.suspendedLanes,
      p = e.pingedLanes,
      v = s & 268435455;
    if (v !== 0) {
      var C = v & ~f;
      C !== 0 ? (u = ai(C)) : ((p &= v), p !== 0 && (u = ai(p)));
    } else (v = s & ~f), v !== 0 ? (u = ai(v)) : p !== 0 && (u = ai(p));
    if (u === 0) return 0;
    if (
      t !== 0 &&
      t !== u &&
      (t & f) === 0 &&
      ((f = u & -u), (p = t & -t), f >= p || (f === 16 && (p & 4194240) !== 0))
    )
      return t;
    if (((u & 4) !== 0 && (u |= s & 16), (t = e.entangledLanes), t !== 0))
      for (e = e.entanglements, t &= u; 0 < t; ) (s = 31 - Xe(t)), (f = 1 << s), (u |= e[s]), (t &= ~f);
    return u;
  }
  function x1(e, t) {
    switch (e) {
      case 1:
      case 2:
      case 4:
        return t + 250;
      case 8:
      case 16:
      case 32:
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return -1;
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function P1(e, t) {
    for (var s = e.suspendedLanes, u = e.pingedLanes, f = e.expirationTimes, p = e.pendingLanes; 0 < p; ) {
      var v = 31 - Xe(p),
        C = 1 << v,
        R = f[v];
      R === -1 ? ((C & s) === 0 || (C & u) !== 0) && (f[v] = x1(C, t)) : R <= t && (e.expiredLanes |= C), (p &= ~C);
    }
  }
  function Ol(e) {
    return (e = e.pendingLanes & -1073741825), e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
  }
  function Qh() {
    var e = cn;
    return (cn <<= 1), (cn & 4194240) === 0 && (cn = 64), e;
  }
  function xl(e) {
    for (var t = [], s = 0; 31 > s; s++) t.push(e);
    return t;
  }
  function Co(e, t, s) {
    (e.pendingLanes |= t),
      t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
      (e = e.eventTimes),
      (t = 31 - Xe(t)),
      (e[t] = s);
  }
  function T1(e, t) {
    var s = e.pendingLanes & ~t;
    (e.pendingLanes = t),
      (e.suspendedLanes = 0),
      (e.pingedLanes = 0),
      (e.expiredLanes &= t),
      (e.mutableReadLanes &= t),
      (e.entangledLanes &= t),
      (t = e.entanglements);
    var u = e.eventTimes;
    for (e = e.expirationTimes; 0 < s; ) {
      var f = 31 - Xe(s),
        p = 1 << f;
      (t[f] = 0), (u[f] = -1), (e[f] = -1), (s &= ~p);
    }
  }
  function Pl(e, t) {
    var s = (e.entangledLanes |= t);
    for (e = e.entanglements; s; ) {
      var u = 31 - Xe(s),
        f = 1 << u;
      (f & t) | (e[u] & t) && (e[u] |= t), (s &= ~f);
    }
  }
  var We = 0;
  function Zh(e) {
    return (e &= -e), 1 < e ? (4 < e ? ((e & 268435455) !== 0 ? 16 : 536870912) : 4) : 1;
  }
  var Jh,
    Tl,
    em,
    tm,
    rm,
    Rl = !1,
    Ba = [],
    Pn = null,
    Tn = null,
    Rn = null,
    Oo = new Map(),
    xo = new Map(),
    In = [],
    R1 =
      'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit'.split(
        ' '
      );
  function nm(e, t) {
    switch (e) {
      case 'focusin':
      case 'focusout':
        Pn = null;
        break;
      case 'dragenter':
      case 'dragleave':
        Tn = null;
        break;
      case 'mouseover':
      case 'mouseout':
        Rn = null;
        break;
      case 'pointerover':
      case 'pointerout':
        Oo.delete(t.pointerId);
        break;
      case 'gotpointercapture':
      case 'lostpointercapture':
        xo.delete(t.pointerId);
    }
  }
  function Po(e, t, s, u, f, p) {
    return e === null || e.nativeEvent !== p
      ? ((e = { blockedOn: t, domEventName: s, eventSystemFlags: u, nativeEvent: p, targetContainers: [f] }),
        t !== null && ((t = qo(t)), t !== null && Tl(t)),
        e)
      : ((e.eventSystemFlags |= u), (t = e.targetContainers), f !== null && t.indexOf(f) === -1 && t.push(f), e);
  }
  function I1(e, t, s, u, f) {
    switch (t) {
      case 'focusin':
        return (Pn = Po(Pn, e, t, s, u, f)), !0;
      case 'dragenter':
        return (Tn = Po(Tn, e, t, s, u, f)), !0;
      case 'mouseover':
        return (Rn = Po(Rn, e, t, s, u, f)), !0;
      case 'pointerover':
        var p = f.pointerId;
        return Oo.set(p, Po(Oo.get(p) || null, e, t, s, u, f)), !0;
      case 'gotpointercapture':
        return (p = f.pointerId), xo.set(p, Po(xo.get(p) || null, e, t, s, u, f)), !0;
    }
    return !1;
  }
  function im(e) {
    var t = si(e.target);
    if (t !== null) {
      var s = ve(t);
      if (s !== null) {
        if (((t = s.tag), t === 13)) {
          if (((t = Pe(s)), t !== null)) {
            (e.blockedOn = t),
              rm(e.priority, function () {
                em(s);
              });
            return;
          }
        } else if (t === 3 && s.stateNode.current.memoizedState.isDehydrated) {
          e.blockedOn = s.tag === 3 ? s.stateNode.containerInfo : null;
          return;
        }
      }
    }
    e.blockedOn = null;
  }
  function Ua(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var s = Nl(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
      if (s === null) {
        s = e.nativeEvent;
        var u = new s.constructor(s.type, s);
        (on = u), s.target.dispatchEvent(u), (on = null);
      } else return (t = qo(s)), t !== null && Tl(t), (e.blockedOn = s), !1;
      t.shift();
    }
    return !0;
  }
  function om(e, t, s) {
    Ua(e) && s.delete(t);
  }
  function N1() {
    (Rl = !1),
      Pn !== null && Ua(Pn) && (Pn = null),
      Tn !== null && Ua(Tn) && (Tn = null),
      Rn !== null && Ua(Rn) && (Rn = null),
      Oo.forEach(om),
      xo.forEach(om);
  }
  function To(e, t) {
    e.blockedOn === t &&
      ((e.blockedOn = null), Rl || ((Rl = !0), r.unstable_scheduleCallback(r.unstable_NormalPriority, N1)));
  }
  function Ro(e) {
    function t(f) {
      return To(f, e);
    }
    if (0 < Ba.length) {
      To(Ba[0], e);
      for (var s = 1; s < Ba.length; s++) {
        var u = Ba[s];
        u.blockedOn === e && (u.blockedOn = null);
      }
    }
    for (
      Pn !== null && To(Pn, e), Tn !== null && To(Tn, e), Rn !== null && To(Rn, e), Oo.forEach(t), xo.forEach(t), s = 0;
      s < In.length;
      s++
    )
      (u = In[s]), u.blockedOn === e && (u.blockedOn = null);
    for (; 0 < In.length && ((s = In[0]), s.blockedOn === null); ) im(s), s.blockedOn === null && In.shift();
  }
  var Ii = H.ReactCurrentBatchConfig,
    Ha = !0;
  function k1(e, t, s, u) {
    var f = We,
      p = Ii.transition;
    Ii.transition = null;
    try {
      (We = 1), Il(e, t, s, u);
    } finally {
      (We = f), (Ii.transition = p);
    }
  }
  function A1(e, t, s, u) {
    var f = We,
      p = Ii.transition;
    Ii.transition = null;
    try {
      (We = 4), Il(e, t, s, u);
    } finally {
      (We = f), (Ii.transition = p);
    }
  }
  function Il(e, t, s, u) {
    if (Ha) {
      var f = Nl(e, t, s, u);
      if (f === null) Gl(e, t, u, Ka, s), nm(e, u);
      else if (I1(f, e, t, s, u)) u.stopPropagation();
      else if ((nm(e, u), t & 4 && -1 < R1.indexOf(e))) {
        for (; f !== null; ) {
          var p = qo(f);
          if ((p !== null && Jh(p), (p = Nl(e, t, s, u)), p === null && Gl(e, t, u, Ka, s), p === f)) break;
          f = p;
        }
        f !== null && u.stopPropagation();
      } else Gl(e, t, u, null, s);
    }
  }
  var Ka = null;
  function Nl(e, t, s, u) {
    if (((Ka = null), (e = Kr(u)), (e = si(e)), e !== null))
      if (((t = ve(e)), t === null)) e = null;
      else if (((s = t.tag), s === 13)) {
        if (((e = Pe(t)), e !== null)) return e;
        e = null;
      } else if (s === 3) {
        if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
        e = null;
      } else t !== e && (e = null);
    return (Ka = e), null;
  }
  function am(e) {
    switch (e) {
      case 'cancel':
      case 'click':
      case 'close':
      case 'contextmenu':
      case 'copy':
      case 'cut':
      case 'auxclick':
      case 'dblclick':
      case 'dragend':
      case 'dragstart':
      case 'drop':
      case 'focusin':
      case 'focusout':
      case 'input':
      case 'invalid':
      case 'keydown':
      case 'keypress':
      case 'keyup':
      case 'mousedown':
      case 'mouseup':
      case 'paste':
      case 'pause':
      case 'play':
      case 'pointercancel':
      case 'pointerdown':
      case 'pointerup':
      case 'ratechange':
      case 'reset':
      case 'resize':
      case 'seeked':
      case 'submit':
      case 'touchcancel':
      case 'touchend':
      case 'touchstart':
      case 'volumechange':
      case 'change':
      case 'selectionchange':
      case 'textInput':
      case 'compositionstart':
      case 'compositionend':
      case 'compositionupdate':
      case 'beforeblur':
      case 'afterblur':
      case 'beforeinput':
      case 'blur':
      case 'fullscreenchange':
      case 'focus':
      case 'hashchange':
      case 'popstate':
      case 'select':
      case 'selectstart':
        return 1;
      case 'drag':
      case 'dragenter':
      case 'dragexit':
      case 'dragleave':
      case 'dragover':
      case 'mousemove':
      case 'mouseout':
      case 'mouseover':
      case 'pointermove':
      case 'pointerout':
      case 'pointerover':
      case 'scroll':
      case 'toggle':
      case 'touchmove':
      case 'wheel':
      case 'mouseenter':
      case 'mouseleave':
      case 'pointerenter':
      case 'pointerleave':
        return 4;
      case 'message':
        switch (ni()) {
          case vr:
            return 1;
          case ur:
            return 4;
          case On:
          case ii:
            return 16;
          case Wr:
            return 536870912;
          default:
            return 16;
        }
      default:
        return 16;
    }
  }
  var Nn = null,
    kl = null,
    Va = null;
  function sm() {
    if (Va) return Va;
    var e,
      t = kl,
      s = t.length,
      u,
      f = 'value' in Nn ? Nn.value : Nn.textContent,
      p = f.length;
    for (e = 0; e < s && t[e] === f[e]; e++);
    var v = s - e;
    for (u = 1; u <= v && t[s - u] === f[p - u]; u++);
    return (Va = f.slice(e, 1 < u ? 1 - u : void 0));
  }
  function Wa(e) {
    var t = e.keyCode;
    return (
      'charCode' in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
      e === 10 && (e = 13),
      32 <= e || e === 13 ? e : 0
    );
  }
  function Ga() {
    return !0;
  }
  function lm() {
    return !1;
  }
  function cr(e) {
    function t(s, u, f, p, v) {
      (this._reactName = s),
        (this._targetInst = f),
        (this.type = u),
        (this.nativeEvent = p),
        (this.target = v),
        (this.currentTarget = null);
      for (var C in e) e.hasOwnProperty(C) && ((s = e[C]), (this[C] = s ? s(p) : p[C]));
      return (
        (this.isDefaultPrevented = (p.defaultPrevented != null ? p.defaultPrevented : p.returnValue === !1) ? Ga : lm),
        (this.isPropagationStopped = lm),
        this
      );
    }
    return (
      ee(t.prototype, {
        preventDefault: function () {
          this.defaultPrevented = !0;
          var s = this.nativeEvent;
          s &&
            (s.preventDefault ? s.preventDefault() : typeof s.returnValue != 'unknown' && (s.returnValue = !1),
            (this.isDefaultPrevented = Ga));
        },
        stopPropagation: function () {
          var s = this.nativeEvent;
          s &&
            (s.stopPropagation ? s.stopPropagation() : typeof s.cancelBubble != 'unknown' && (s.cancelBubble = !0),
            (this.isPropagationStopped = Ga));
        },
        persist: function () {},
        isPersistent: Ga,
      }),
      t
    );
  }
  var Ni = {
      eventPhase: 0,
      bubbles: 0,
      cancelable: 0,
      timeStamp: function (e) {
        return e.timeStamp || Date.now();
      },
      defaultPrevented: 0,
      isTrusted: 0,
    },
    Al = cr(Ni),
    Io = ee({}, Ni, { view: 0, detail: 0 }),
    L1 = cr(Io),
    Ll,
    jl,
    No,
    Xa = ee({}, Io, {
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      getModifierState: Ml,
      button: 0,
      buttons: 0,
      relatedTarget: function (e) {
        return e.relatedTarget === void 0
          ? e.fromElement === e.srcElement
            ? e.toElement
            : e.fromElement
          : e.relatedTarget;
      },
      movementX: function (e) {
        return 'movementX' in e
          ? e.movementX
          : (e !== No &&
              (No && e.type === 'mousemove'
                ? ((Ll = e.screenX - No.screenX), (jl = e.screenY - No.screenY))
                : (jl = Ll = 0),
              (No = e)),
            Ll);
      },
      movementY: function (e) {
        return 'movementY' in e ? e.movementY : jl;
      },
    }),
    um = cr(Xa),
    j1 = ee({}, Xa, { dataTransfer: 0 }),
    D1 = cr(j1),
    M1 = ee({}, Io, { relatedTarget: 0 }),
    Dl = cr(M1),
    F1 = ee({}, Ni, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
    $1 = cr(F1),
    z1 = ee({}, Ni, {
      clipboardData: function (e) {
        return 'clipboardData' in e ? e.clipboardData : window.clipboardData;
      },
    }),
    q1 = cr(z1),
    B1 = ee({}, Ni, { data: 0 }),
    cm = cr(B1),
    U1 = {
      Esc: 'Escape',
      Spacebar: ' ',
      Left: 'ArrowLeft',
      Up: 'ArrowUp',
      Right: 'ArrowRight',
      Down: 'ArrowDown',
      Del: 'Delete',
      Win: 'OS',
      Menu: 'ContextMenu',
      Apps: 'ContextMenu',
      Scroll: 'ScrollLock',
      MozPrintableKey: 'Unidentified',
    },
    H1 = {
      8: 'Backspace',
      9: 'Tab',
      12: 'Clear',
      13: 'Enter',
      16: 'Shift',
      17: 'Control',
      18: 'Alt',
      19: 'Pause',
      20: 'CapsLock',
      27: 'Escape',
      32: ' ',
      33: 'PageUp',
      34: 'PageDown',
      35: 'End',
      36: 'Home',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      45: 'Insert',
      46: 'Delete',
      112: 'F1',
      113: 'F2',
      114: 'F3',
      115: 'F4',
      116: 'F5',
      117: 'F6',
      118: 'F7',
      119: 'F8',
      120: 'F9',
      121: 'F10',
      122: 'F11',
      123: 'F12',
      144: 'NumLock',
      145: 'ScrollLock',
      224: 'Meta',
    },
    K1 = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' };
  function V1(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = K1[e]) ? !!t[e] : !1;
  }
  function Ml() {
    return V1;
  }
  var W1 = ee({}, Io, {
      key: function (e) {
        if (e.key) {
          var t = U1[e.key] || e.key;
          if (t !== 'Unidentified') return t;
        }
        return e.type === 'keypress'
          ? ((e = Wa(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
          : e.type === 'keydown' || e.type === 'keyup'
          ? H1[e.keyCode] || 'Unidentified'
          : '';
      },
      code: 0,
      location: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      repeat: 0,
      locale: 0,
      getModifierState: Ml,
      charCode: function (e) {
        return e.type === 'keypress' ? Wa(e) : 0;
      },
      keyCode: function (e) {
        return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
      },
      which: function (e) {
        return e.type === 'keypress' ? Wa(e) : e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
      },
    }),
    G1 = cr(W1),
    X1 = ee({}, Xa, {
      pointerId: 0,
      width: 0,
      height: 0,
      pressure: 0,
      tangentialPressure: 0,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
      pointerType: 0,
      isPrimary: 0,
    }),
    dm = cr(X1),
    Y1 = ee({}, Io, {
      touches: 0,
      targetTouches: 0,
      changedTouches: 0,
      altKey: 0,
      metaKey: 0,
      ctrlKey: 0,
      shiftKey: 0,
      getModifierState: Ml,
    }),
    Q1 = cr(Y1),
    Z1 = ee({}, Ni, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
    J1 = cr(Z1),
    eE = ee({}, Xa, {
      deltaX: function (e) {
        return 'deltaX' in e ? e.deltaX : 'wheelDeltaX' in e ? -e.wheelDeltaX : 0;
      },
      deltaY: function (e) {
        return 'deltaY' in e ? e.deltaY : 'wheelDeltaY' in e ? -e.wheelDeltaY : 'wheelDelta' in e ? -e.wheelDelta : 0;
      },
      deltaZ: 0,
      deltaMode: 0,
    }),
    tE = cr(eE),
    rE = [9, 13, 27, 32],
    Fl = d && 'CompositionEvent' in window,
    ko = null;
  d && 'documentMode' in document && (ko = document.documentMode);
  var nE = d && 'TextEvent' in window && !ko,
    fm = d && (!Fl || (ko && 8 < ko && 11 >= ko)),
    pm = ' ',
    hm = !1;
  function mm(e, t) {
    switch (e) {
      case 'keyup':
        return rE.indexOf(t.keyCode) !== -1;
      case 'keydown':
        return t.keyCode !== 229;
      case 'keypress':
      case 'mousedown':
      case 'focusout':
        return !0;
      default:
        return !1;
    }
  }
  function gm(e) {
    return (e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null;
  }
  var ki = !1;
  function iE(e, t) {
    switch (e) {
      case 'compositionend':
        return gm(t);
      case 'keypress':
        return t.which !== 32 ? null : ((hm = !0), pm);
      case 'textInput':
        return (e = t.data), e === pm && hm ? null : e;
      default:
        return null;
    }
  }
  function oE(e, t) {
    if (ki)
      return e === 'compositionend' || (!Fl && mm(e, t)) ? ((e = sm()), (Va = kl = Nn = null), (ki = !1), e) : null;
    switch (e) {
      case 'paste':
        return null;
      case 'keypress':
        if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
          if (t.char && 1 < t.char.length) return t.char;
          if (t.which) return String.fromCharCode(t.which);
        }
        return null;
      case 'compositionend':
        return fm && t.locale !== 'ko' ? null : t.data;
      default:
        return null;
    }
  }
  var aE = {
    color: !0,
    date: !0,
    datetime: !0,
    'datetime-local': !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0,
  };
  function ym(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === 'input' ? !!aE[e.type] : t === 'textarea';
  }
  function vm(e, t, s, u) {
    yr(u),
      (t = es(t, 'onChange')),
      0 < t.length && ((s = new Al('onChange', 'change', null, s, u)), e.push({ event: s, listeners: t }));
  }
  var Ao = null,
    Lo = null;
  function sE(e) {
    Dm(e, 0);
  }
  function Ya(e) {
    var t = Mi(e);
    if (it(t)) return e;
  }
  function lE(e, t) {
    if (e === 'change') return t;
  }
  var wm = !1;
  if (d) {
    var $l;
    if (d) {
      var zl = 'oninput' in document;
      if (!zl) {
        var _m = document.createElement('div');
        _m.setAttribute('oninput', 'return;'), (zl = typeof _m.oninput == 'function');
      }
      $l = zl;
    } else $l = !1;
    wm = $l && (!document.documentMode || 9 < document.documentMode);
  }
  function Sm() {
    Ao && (Ao.detachEvent('onpropertychange', Em), (Lo = Ao = null));
  }
  function Em(e) {
    if (e.propertyName === 'value' && Ya(Lo)) {
      var t = [];
      vm(t, Lo, e, Kr(e)), Eo(sE, t);
    }
  }
  function uE(e, t, s) {
    e === 'focusin' ? (Sm(), (Ao = t), (Lo = s), Ao.attachEvent('onpropertychange', Em)) : e === 'focusout' && Sm();
  }
  function cE(e) {
    if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return Ya(Lo);
  }
  function dE(e, t) {
    if (e === 'click') return Ya(t);
  }
  function fE(e, t) {
    if (e === 'input' || e === 'change') return Ya(t);
  }
  function pE(e, t) {
    return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
  }
  var kr = typeof Object.is == 'function' ? Object.is : pE;
  function jo(e, t) {
    if (kr(e, t)) return !0;
    if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1;
    var s = Object.keys(e),
      u = Object.keys(t);
    if (s.length !== u.length) return !1;
    for (u = 0; u < s.length; u++) {
      var f = s[u];
      if (!h.call(t, f) || !kr(e[f], t[f])) return !1;
    }
    return !0;
  }
  function bm(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Cm(e, t) {
    var s = bm(e);
    e = 0;
    for (var u; s; ) {
      if (s.nodeType === 3) {
        if (((u = e + s.textContent.length), e <= t && u >= t)) return { node: s, offset: t - e };
        e = u;
      }
      e: {
        for (; s; ) {
          if (s.nextSibling) {
            s = s.nextSibling;
            break e;
          }
          s = s.parentNode;
        }
        s = void 0;
      }
      s = bm(s);
    }
  }
  function Om(e, t) {
    return e && t
      ? e === t
        ? !0
        : e && e.nodeType === 3
        ? !1
        : t && t.nodeType === 3
        ? Om(e, t.parentNode)
        : 'contains' in e
        ? e.contains(t)
        : e.compareDocumentPosition
        ? !!(e.compareDocumentPosition(t) & 16)
        : !1
      : !1;
  }
  function xm() {
    for (var e = window, t = Bt(); t instanceof e.HTMLIFrameElement; ) {
      try {
        var s = typeof t.contentWindow.location.href == 'string';
      } catch {
        s = !1;
      }
      if (s) e = t.contentWindow;
      else break;
      t = Bt(e.document);
    }
    return t;
  }
  function ql(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return (
      t &&
      ((t === 'input' &&
        (e.type === 'text' || e.type === 'search' || e.type === 'tel' || e.type === 'url' || e.type === 'password')) ||
        t === 'textarea' ||
        e.contentEditable === 'true')
    );
  }
  function hE(e) {
    var t = xm(),
      s = e.focusedElem,
      u = e.selectionRange;
    if (t !== s && s && s.ownerDocument && Om(s.ownerDocument.documentElement, s)) {
      if (u !== null && ql(s)) {
        if (((t = u.start), (e = u.end), e === void 0 && (e = t), 'selectionStart' in s))
          (s.selectionStart = t), (s.selectionEnd = Math.min(e, s.value.length));
        else if (((e = ((t = s.ownerDocument || document) && t.defaultView) || window), e.getSelection)) {
          e = e.getSelection();
          var f = s.textContent.length,
            p = Math.min(u.start, f);
          (u = u.end === void 0 ? p : Math.min(u.end, f)),
            !e.extend && p > u && ((f = u), (u = p), (p = f)),
            (f = Cm(s, p));
          var v = Cm(s, u);
          f &&
            v &&
            (e.rangeCount !== 1 ||
              e.anchorNode !== f.node ||
              e.anchorOffset !== f.offset ||
              e.focusNode !== v.node ||
              e.focusOffset !== v.offset) &&
            ((t = t.createRange()),
            t.setStart(f.node, f.offset),
            e.removeAllRanges(),
            p > u ? (e.addRange(t), e.extend(v.node, v.offset)) : (t.setEnd(v.node, v.offset), e.addRange(t)));
        }
      }
      for (t = [], e = s; (e = e.parentNode); )
        e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
      for (typeof s.focus == 'function' && s.focus(), s = 0; s < t.length; s++)
        (e = t[s]), (e.element.scrollLeft = e.left), (e.element.scrollTop = e.top);
    }
  }
  var mE = d && 'documentMode' in document && 11 >= document.documentMode,
    Ai = null,
    Bl = null,
    Do = null,
    Ul = !1;
  function Pm(e, t, s) {
    var u = s.window === s ? s.document : s.nodeType === 9 ? s : s.ownerDocument;
    Ul ||
      Ai == null ||
      Ai !== Bt(u) ||
      ((u = Ai),
      'selectionStart' in u && ql(u)
        ? (u = { start: u.selectionStart, end: u.selectionEnd })
        : ((u = ((u.ownerDocument && u.ownerDocument.defaultView) || window).getSelection()),
          (u = {
            anchorNode: u.anchorNode,
            anchorOffset: u.anchorOffset,
            focusNode: u.focusNode,
            focusOffset: u.focusOffset,
          })),
      (Do && jo(Do, u)) ||
        ((Do = u),
        (u = es(Bl, 'onSelect')),
        0 < u.length &&
          ((t = new Al('onSelect', 'select', null, t, s)), e.push({ event: t, listeners: u }), (t.target = Ai))));
  }
  function Qa(e, t) {
    var s = {};
    return (s[e.toLowerCase()] = t.toLowerCase()), (s['Webkit' + e] = 'webkit' + t), (s['Moz' + e] = 'moz' + t), s;
  }
  var Li = {
      animationend: Qa('Animation', 'AnimationEnd'),
      animationiteration: Qa('Animation', 'AnimationIteration'),
      animationstart: Qa('Animation', 'AnimationStart'),
      transitionend: Qa('Transition', 'TransitionEnd'),
    },
    Hl = {},
    Tm = {};
  d &&
    ((Tm = document.createElement('div').style),
    'AnimationEvent' in window ||
      (delete Li.animationend.animation, delete Li.animationiteration.animation, delete Li.animationstart.animation),
    'TransitionEvent' in window || delete Li.transitionend.transition);
  function Za(e) {
    if (Hl[e]) return Hl[e];
    if (!Li[e]) return e;
    var t = Li[e],
      s;
    for (s in t) if (t.hasOwnProperty(s) && s in Tm) return (Hl[e] = t[s]);
    return e;
  }
  var Rm = Za('animationend'),
    Im = Za('animationiteration'),
    Nm = Za('animationstart'),
    km = Za('transitionend'),
    Am = new Map(),
    Lm =
      'abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
        ' '
      );
  function kn(e, t) {
    Am.set(e, t), l(t, [e]);
  }
  for (var Kl = 0; Kl < Lm.length; Kl++) {
    var Vl = Lm[Kl],
      gE = Vl.toLowerCase(),
      yE = Vl[0].toUpperCase() + Vl.slice(1);
    kn(gE, 'on' + yE);
  }
  kn(Rm, 'onAnimationEnd'),
    kn(Im, 'onAnimationIteration'),
    kn(Nm, 'onAnimationStart'),
    kn('dblclick', 'onDoubleClick'),
    kn('focusin', 'onFocus'),
    kn('focusout', 'onBlur'),
    kn(km, 'onTransitionEnd'),
    c('onMouseEnter', ['mouseout', 'mouseover']),
    c('onMouseLeave', ['mouseout', 'mouseover']),
    c('onPointerEnter', ['pointerout', 'pointerover']),
    c('onPointerLeave', ['pointerout', 'pointerover']),
    l('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' ')),
    l('onSelect', 'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(' ')),
    l('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste']),
    l('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' ')),
    l('onCompositionStart', 'compositionstart focusout keydown keypress keyup mousedown'.split(' ')),
    l('onCompositionUpdate', 'compositionupdate focusout keydown keypress keyup mousedown'.split(' '));
  var Mo =
      'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
        ' '
      ),
    vE = new Set('cancel close invalid load scroll toggle'.split(' ').concat(Mo));
  function jm(e, t, s) {
    var u = e.type || 'unknown-event';
    (e.currentTarget = s), Se(u, t, void 0, e), (e.currentTarget = null);
  }
  function Dm(e, t) {
    t = (t & 4) !== 0;
    for (var s = 0; s < e.length; s++) {
      var u = e[s],
        f = u.event;
      u = u.listeners;
      e: {
        var p = void 0;
        if (t)
          for (var v = u.length - 1; 0 <= v; v--) {
            var C = u[v],
              R = C.instance,
              B = C.currentTarget;
            if (((C = C.listener), R !== p && f.isPropagationStopped())) break e;
            jm(f, C, B), (p = R);
          }
        else
          for (v = 0; v < u.length; v++) {
            if (
              ((C = u[v]),
              (R = C.instance),
              (B = C.currentTarget),
              (C = C.listener),
              R !== p && f.isPropagationStopped())
            )
              break e;
            jm(f, C, B), (p = R);
          }
      }
    }
    if (ne) throw ((e = we), (ne = !1), (we = null), e);
  }
  function Je(e, t) {
    var s = t[eu];
    s === void 0 && (s = t[eu] = new Set());
    var u = e + '__bubble';
    s.has(u) || (Mm(t, e, 2, !1), s.add(u));
  }
  function Wl(e, t, s) {
    var u = 0;
    t && (u |= 4), Mm(s, e, u, t);
  }
  var Ja = '_reactListening' + Math.random().toString(36).slice(2);
  function Fo(e) {
    if (!e[Ja]) {
      (e[Ja] = !0),
        o.forEach(function (s) {
          s !== 'selectionchange' && (vE.has(s) || Wl(s, !1, e), Wl(s, !0, e));
        });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[Ja] || ((t[Ja] = !0), Wl('selectionchange', !1, t));
    }
  }
  function Mm(e, t, s, u) {
    switch (am(t)) {
      case 1:
        var f = k1;
        break;
      case 4:
        f = A1;
        break;
      default:
        f = Il;
    }
    (s = f.bind(null, t, s, e)),
      (f = void 0),
      !bo || (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') || (f = !0),
      u
        ? f !== void 0
          ? e.addEventListener(t, s, { capture: !0, passive: f })
          : e.addEventListener(t, s, !0)
        : f !== void 0
        ? e.addEventListener(t, s, { passive: f })
        : e.addEventListener(t, s, !1);
  }
  function Gl(e, t, s, u, f) {
    var p = u;
    if ((t & 1) === 0 && (t & 2) === 0 && u !== null)
      e: for (;;) {
        if (u === null) return;
        var v = u.tag;
        if (v === 3 || v === 4) {
          var C = u.stateNode.containerInfo;
          if (C === f || (C.nodeType === 8 && C.parentNode === f)) break;
          if (v === 4)
            for (v = u.return; v !== null; ) {
              var R = v.tag;
              if (
                (R === 3 || R === 4) &&
                ((R = v.stateNode.containerInfo), R === f || (R.nodeType === 8 && R.parentNode === f))
              )
                return;
              v = v.return;
            }
          for (; C !== null; ) {
            if (((v = si(C)), v === null)) return;
            if (((R = v.tag), R === 5 || R === 6)) {
              u = p = v;
              continue e;
            }
            C = C.parentNode;
          }
        }
        u = u.return;
      }
    Eo(function () {
      var B = p,
        Q = Kr(s),
        J = [];
      e: {
        var Y = Am.get(e);
        if (Y !== void 0) {
          var ae = Al,
            he = e;
          switch (e) {
            case 'keypress':
              if (Wa(s) === 0) break e;
            case 'keydown':
            case 'keyup':
              ae = G1;
              break;
            case 'focusin':
              (he = 'focus'), (ae = Dl);
              break;
            case 'focusout':
              (he = 'blur'), (ae = Dl);
              break;
            case 'beforeblur':
            case 'afterblur':
              ae = Dl;
              break;
            case 'click':
              if (s.button === 2) break e;
            case 'auxclick':
            case 'dblclick':
            case 'mousedown':
            case 'mousemove':
            case 'mouseup':
            case 'mouseout':
            case 'mouseover':
            case 'contextmenu':
              ae = um;
              break;
            case 'drag':
            case 'dragend':
            case 'dragenter':
            case 'dragexit':
            case 'dragleave':
            case 'dragover':
            case 'dragstart':
            case 'drop':
              ae = D1;
              break;
            case 'touchcancel':
            case 'touchend':
            case 'touchmove':
            case 'touchstart':
              ae = Q1;
              break;
            case Rm:
            case Im:
            case Nm:
              ae = $1;
              break;
            case km:
              ae = J1;
              break;
            case 'scroll':
              ae = L1;
              break;
            case 'wheel':
              ae = tE;
              break;
            case 'copy':
            case 'cut':
            case 'paste':
              ae = q1;
              break;
            case 'gotpointercapture':
            case 'lostpointercapture':
            case 'pointercancel':
            case 'pointerdown':
            case 'pointermove':
            case 'pointerout':
            case 'pointerover':
            case 'pointerup':
              ae = dm;
          }
          var ge = (t & 4) !== 0,
            pt = !ge && e === 'scroll',
            D = ge ? (Y !== null ? Y + 'Capture' : null) : Y;
          ge = [];
          for (var N = B, M; N !== null; ) {
            M = N;
            var re = M.stateNode;
            if (
              (M.tag === 5 &&
                re !== null &&
                ((M = re), D !== null && ((re = ri(N, D)), re != null && ge.push($o(N, re, M)))),
              pt)
            )
              break;
            N = N.return;
          }
          0 < ge.length && ((Y = new ae(Y, he, null, s, Q)), J.push({ event: Y, listeners: ge }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (
            ((Y = e === 'mouseover' || e === 'pointerover'),
            (ae = e === 'mouseout' || e === 'pointerout'),
            Y && s !== on && (he = s.relatedTarget || s.fromElement) && (si(he) || he[dn]))
          )
            break e;
          if (
            (ae || Y) &&
            ((Y = Q.window === Q ? Q : (Y = Q.ownerDocument) ? Y.defaultView || Y.parentWindow : window),
            ae
              ? ((he = s.relatedTarget || s.toElement),
                (ae = B),
                (he = he ? si(he) : null),
                he !== null && ((pt = ve(he)), he !== pt || (he.tag !== 5 && he.tag !== 6)) && (he = null))
              : ((ae = null), (he = B)),
            ae !== he)
          ) {
            if (
              ((ge = um),
              (re = 'onMouseLeave'),
              (D = 'onMouseEnter'),
              (N = 'mouse'),
              (e === 'pointerout' || e === 'pointerover') &&
                ((ge = dm), (re = 'onPointerLeave'), (D = 'onPointerEnter'), (N = 'pointer')),
              (pt = ae == null ? Y : Mi(ae)),
              (M = he == null ? Y : Mi(he)),
              (Y = new ge(re, N + 'leave', ae, s, Q)),
              (Y.target = pt),
              (Y.relatedTarget = M),
              (re = null),
              si(Q) === B &&
                ((ge = new ge(D, N + 'enter', he, s, Q)), (ge.target = M), (ge.relatedTarget = pt), (re = ge)),
              (pt = re),
              ae && he)
            )
              t: {
                for (ge = ae, D = he, N = 0, M = ge; M; M = ji(M)) N++;
                for (M = 0, re = D; re; re = ji(re)) M++;
                for (; 0 < N - M; ) (ge = ji(ge)), N--;
                for (; 0 < M - N; ) (D = ji(D)), M--;
                for (; N--; ) {
                  if (ge === D || (D !== null && ge === D.alternate)) break t;
                  (ge = ji(ge)), (D = ji(D));
                }
                ge = null;
              }
            else ge = null;
            ae !== null && Fm(J, Y, ae, ge, !1), he !== null && pt !== null && Fm(J, pt, he, ge, !0);
          }
        }
        e: {
          if (
            ((Y = B ? Mi(B) : window),
            (ae = Y.nodeName && Y.nodeName.toLowerCase()),
            ae === 'select' || (ae === 'input' && Y.type === 'file'))
          )
            var _e = lE;
          else if (ym(Y))
            if (wm) _e = fE;
            else {
              _e = cE;
              var Oe = uE;
            }
          else
            (ae = Y.nodeName) &&
              ae.toLowerCase() === 'input' &&
              (Y.type === 'checkbox' || Y.type === 'radio') &&
              (_e = dE);
          if (_e && (_e = _e(e, B))) {
            vm(J, _e, s, Q);
            break e;
          }
          Oe && Oe(e, Y, B),
            e === 'focusout' &&
              (Oe = Y._wrapperState) &&
              Oe.controlled &&
              Y.type === 'number' &&
              Ut(Y, 'number', Y.value);
        }
        switch (((Oe = B ? Mi(B) : window), e)) {
          case 'focusin':
            (ym(Oe) || Oe.contentEditable === 'true') && ((Ai = Oe), (Bl = B), (Do = null));
            break;
          case 'focusout':
            Do = Bl = Ai = null;
            break;
          case 'mousedown':
            Ul = !0;
            break;
          case 'contextmenu':
          case 'mouseup':
          case 'dragend':
            (Ul = !1), Pm(J, s, Q);
            break;
          case 'selectionchange':
            if (mE) break;
          case 'keydown':
          case 'keyup':
            Pm(J, s, Q);
        }
        var xe;
        if (Fl)
          e: {
            switch (e) {
              case 'compositionstart':
                var Ie = 'onCompositionStart';
                break e;
              case 'compositionend':
                Ie = 'onCompositionEnd';
                break e;
              case 'compositionupdate':
                Ie = 'onCompositionUpdate';
                break e;
            }
            Ie = void 0;
          }
        else
          ki
            ? mm(e, s) && (Ie = 'onCompositionEnd')
            : e === 'keydown' && s.keyCode === 229 && (Ie = 'onCompositionStart');
        Ie &&
          (fm &&
            s.locale !== 'ko' &&
            (ki || Ie !== 'onCompositionStart'
              ? Ie === 'onCompositionEnd' && ki && (xe = sm())
              : ((Nn = Q), (kl = 'value' in Nn ? Nn.value : Nn.textContent), (ki = !0))),
          (Oe = es(B, Ie)),
          0 < Oe.length &&
            ((Ie = new cm(Ie, e, null, s, Q)),
            J.push({ event: Ie, listeners: Oe }),
            xe ? (Ie.data = xe) : ((xe = gm(s)), xe !== null && (Ie.data = xe)))),
          (xe = nE ? iE(e, s) : oE(e, s)) &&
            ((B = es(B, 'onBeforeInput')),
            0 < B.length &&
              ((Q = new cm('onBeforeInput', 'beforeinput', null, s, Q)),
              J.push({ event: Q, listeners: B }),
              (Q.data = xe)));
      }
      Dm(J, t);
    });
  }
  function $o(e, t, s) {
    return { instance: e, listener: t, currentTarget: s };
  }
  function es(e, t) {
    for (var s = t + 'Capture', u = []; e !== null; ) {
      var f = e,
        p = f.stateNode;
      f.tag === 5 &&
        p !== null &&
        ((f = p),
        (p = ri(e, s)),
        p != null && u.unshift($o(e, p, f)),
        (p = ri(e, t)),
        p != null && u.push($o(e, p, f))),
        (e = e.return);
    }
    return u;
  }
  function ji(e) {
    if (e === null) return null;
    do e = e.return;
    while (e && e.tag !== 5);
    return e || null;
  }
  function Fm(e, t, s, u, f) {
    for (var p = t._reactName, v = []; s !== null && s !== u; ) {
      var C = s,
        R = C.alternate,
        B = C.stateNode;
      if (R !== null && R === u) break;
      C.tag === 5 &&
        B !== null &&
        ((C = B),
        f
          ? ((R = ri(s, p)), R != null && v.unshift($o(s, R, C)))
          : f || ((R = ri(s, p)), R != null && v.push($o(s, R, C)))),
        (s = s.return);
    }
    v.length !== 0 && e.push({ event: t, listeners: v });
  }
  var wE = /\r\n?/g,
    _E = /\u0000|\uFFFD/g;
  function $m(e) {
    return (typeof e == 'string' ? e : '' + e)
      .replace(
        wE,
        `
`
      )
      .replace(_E, '');
  }
  function ts(e, t, s) {
    if (((t = $m(t)), $m(e) !== t && s)) throw Error(n(425));
  }
  function rs() {}
  var Xl = null,
    Yl = null;
  function Ql(e, t) {
    return (
      e === 'textarea' ||
      e === 'noscript' ||
      typeof t.children == 'string' ||
      typeof t.children == 'number' ||
      (typeof t.dangerouslySetInnerHTML == 'object' &&
        t.dangerouslySetInnerHTML !== null &&
        t.dangerouslySetInnerHTML.__html != null)
    );
  }
  var Zl = typeof setTimeout == 'function' ? setTimeout : void 0,
    SE = typeof clearTimeout == 'function' ? clearTimeout : void 0,
    zm = typeof Promise == 'function' ? Promise : void 0,
    EE =
      typeof queueMicrotask == 'function'
        ? queueMicrotask
        : typeof zm < 'u'
        ? function (e) {
            return zm.resolve(null).then(e).catch(bE);
          }
        : Zl;
  function bE(e) {
    setTimeout(function () {
      throw e;
    });
  }
  function Jl(e, t) {
    var s = t,
      u = 0;
    do {
      var f = s.nextSibling;
      if ((e.removeChild(s), f && f.nodeType === 8))
        if (((s = f.data), s === '/$')) {
          if (u === 0) {
            e.removeChild(f), Ro(t);
            return;
          }
          u--;
        } else (s !== '$' && s !== '$?' && s !== '$!') || u++;
      s = f;
    } while (s);
    Ro(t);
  }
  function An(e) {
    for (; e != null; e = e.nextSibling) {
      var t = e.nodeType;
      if (t === 1 || t === 3) break;
      if (t === 8) {
        if (((t = e.data), t === '$' || t === '$!' || t === '$?')) break;
        if (t === '/$') return null;
      }
    }
    return e;
  }
  function qm(e) {
    e = e.previousSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var s = e.data;
        if (s === '$' || s === '$!' || s === '$?') {
          if (t === 0) return e;
          t--;
        } else s === '/$' && t++;
      }
      e = e.previousSibling;
    }
    return null;
  }
  var Di = Math.random().toString(36).slice(2),
    Gr = '__reactFiber$' + Di,
    zo = '__reactProps$' + Di,
    dn = '__reactContainer$' + Di,
    eu = '__reactEvents$' + Di,
    CE = '__reactListeners$' + Di,
    OE = '__reactHandles$' + Di;
  function si(e) {
    var t = e[Gr];
    if (t) return t;
    for (var s = e.parentNode; s; ) {
      if ((t = s[dn] || s[Gr])) {
        if (((s = t.alternate), t.child !== null || (s !== null && s.child !== null)))
          for (e = qm(e); e !== null; ) {
            if ((s = e[Gr])) return s;
            e = qm(e);
          }
        return t;
      }
      (e = s), (s = e.parentNode);
    }
    return null;
  }
  function qo(e) {
    return (e = e[Gr] || e[dn]), !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e;
  }
  function Mi(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(n(33));
  }
  function ns(e) {
    return e[zo] || null;
  }
  var tu = [],
    Fi = -1;
  function Ln(e) {
    return { current: e };
  }
  function et(e) {
    0 > Fi || ((e.current = tu[Fi]), (tu[Fi] = null), Fi--);
  }
  function Qe(e, t) {
    Fi++, (tu[Fi] = e.current), (e.current = t);
  }
  var jn = {},
    jt = Ln(jn),
    Qt = Ln(!1),
    li = jn;
  function $i(e, t) {
    var s = e.type.contextTypes;
    if (!s) return jn;
    var u = e.stateNode;
    if (u && u.__reactInternalMemoizedUnmaskedChildContext === t) return u.__reactInternalMemoizedMaskedChildContext;
    var f = {},
      p;
    for (p in s) f[p] = t[p];
    return (
      u &&
        ((e = e.stateNode),
        (e.__reactInternalMemoizedUnmaskedChildContext = t),
        (e.__reactInternalMemoizedMaskedChildContext = f)),
      f
    );
  }
  function Zt(e) {
    return (e = e.childContextTypes), e != null;
  }
  function is() {
    et(Qt), et(jt);
  }
  function Bm(e, t, s) {
    if (jt.current !== jn) throw Error(n(168));
    Qe(jt, t), Qe(Qt, s);
  }
  function Um(e, t, s) {
    var u = e.stateNode;
    if (((t = t.childContextTypes), typeof u.getChildContext != 'function')) return s;
    u = u.getChildContext();
    for (var f in u) if (!(f in t)) throw Error(n(108, Ne(e) || 'Unknown', f));
    return ee({}, s, u);
  }
  function os(e) {
    return (
      (e = ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || jn),
      (li = jt.current),
      Qe(jt, e),
      Qe(Qt, Qt.current),
      !0
    );
  }
  function Hm(e, t, s) {
    var u = e.stateNode;
    if (!u) throw Error(n(169));
    s ? ((e = Um(e, t, li)), (u.__reactInternalMemoizedMergedChildContext = e), et(Qt), et(jt), Qe(jt, e)) : et(Qt),
      Qe(Qt, s);
  }
  var fn = null,
    as = !1,
    ru = !1;
  function Km(e) {
    fn === null ? (fn = [e]) : fn.push(e);
  }
  function xE(e) {
    (as = !0), Km(e);
  }
  function Dn() {
    if (!ru && fn !== null) {
      ru = !0;
      var e = 0,
        t = We;
      try {
        var s = fn;
        for (We = 1; e < s.length; e++) {
          var u = s[e];
          do u = u(!0);
          while (u !== null);
        }
        (fn = null), (as = !1);
      } catch (f) {
        throw (fn !== null && (fn = fn.slice(e + 1)), ft(vr, Dn), f);
      } finally {
        (We = t), (ru = !1);
      }
    }
    return null;
  }
  var zi = [],
    qi = 0,
    ss = null,
    ls = 0,
    wr = [],
    _r = 0,
    ui = null,
    pn = 1,
    hn = '';
  function ci(e, t) {
    (zi[qi++] = ls), (zi[qi++] = ss), (ss = e), (ls = t);
  }
  function Vm(e, t, s) {
    (wr[_r++] = pn), (wr[_r++] = hn), (wr[_r++] = ui), (ui = e);
    var u = pn;
    e = hn;
    var f = 32 - Xe(u) - 1;
    (u &= ~(1 << f)), (s += 1);
    var p = 32 - Xe(t) + f;
    if (30 < p) {
      var v = f - (f % 5);
      (p = (u & ((1 << v) - 1)).toString(32)),
        (u >>= v),
        (f -= v),
        (pn = (1 << (32 - Xe(t) + f)) | (s << f) | u),
        (hn = p + e);
    } else (pn = (1 << p) | (s << f) | u), (hn = e);
  }
  function nu(e) {
    e.return !== null && (ci(e, 1), Vm(e, 1, 0));
  }
  function iu(e) {
    for (; e === ss; ) (ss = zi[--qi]), (zi[qi] = null), (ls = zi[--qi]), (zi[qi] = null);
    for (; e === ui; )
      (ui = wr[--_r]), (wr[_r] = null), (hn = wr[--_r]), (wr[_r] = null), (pn = wr[--_r]), (wr[_r] = null);
  }
  var dr = null,
    fr = null,
    rt = !1,
    Ar = null;
  function Wm(e, t) {
    var s = Cr(5, null, null, 0);
    (s.elementType = 'DELETED'),
      (s.stateNode = t),
      (s.return = e),
      (t = e.deletions),
      t === null ? ((e.deletions = [s]), (e.flags |= 16)) : t.push(s);
  }
  function Gm(e, t) {
    switch (e.tag) {
      case 5:
        var s = e.type;
        return (
          (t = t.nodeType !== 1 || s.toLowerCase() !== t.nodeName.toLowerCase() ? null : t),
          t !== null ? ((e.stateNode = t), (dr = e), (fr = An(t.firstChild)), !0) : !1
        );
      case 6:
        return (
          (t = e.pendingProps === '' || t.nodeType !== 3 ? null : t),
          t !== null ? ((e.stateNode = t), (dr = e), (fr = null), !0) : !1
        );
      case 13:
        return (
          (t = t.nodeType !== 8 ? null : t),
          t !== null
            ? ((s = ui !== null ? { id: pn, overflow: hn } : null),
              (e.memoizedState = { dehydrated: t, treeContext: s, retryLane: 1073741824 }),
              (s = Cr(18, null, null, 0)),
              (s.stateNode = t),
              (s.return = e),
              (e.child = s),
              (dr = e),
              (fr = null),
              !0)
            : !1
        );
      default:
        return !1;
    }
  }
  function ou(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
  }
  function au(e) {
    if (rt) {
      var t = fr;
      if (t) {
        var s = t;
        if (!Gm(e, t)) {
          if (ou(e)) throw Error(n(418));
          t = An(s.nextSibling);
          var u = dr;
          t && Gm(e, t) ? Wm(u, s) : ((e.flags = (e.flags & -4097) | 2), (rt = !1), (dr = e));
        }
      } else {
        if (ou(e)) throw Error(n(418));
        (e.flags = (e.flags & -4097) | 2), (rt = !1), (dr = e);
      }
    }
  }
  function Xm(e) {
    for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
    dr = e;
  }
  function us(e) {
    if (e !== dr) return !1;
    if (!rt) return Xm(e), (rt = !0), !1;
    var t;
    if (
      ((t = e.tag !== 3) &&
        !(t = e.tag !== 5) &&
        ((t = e.type), (t = t !== 'head' && t !== 'body' && !Ql(e.type, e.memoizedProps))),
      t && (t = fr))
    ) {
      if (ou(e)) throw (Ym(), Error(n(418)));
      for (; t; ) Wm(e, t), (t = An(t.nextSibling));
    }
    if ((Xm(e), e.tag === 13)) {
      if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(n(317));
      e: {
        for (e = e.nextSibling, t = 0; e; ) {
          if (e.nodeType === 8) {
            var s = e.data;
            if (s === '/$') {
              if (t === 0) {
                fr = An(e.nextSibling);
                break e;
              }
              t--;
            } else (s !== '$' && s !== '$!' && s !== '$?') || t++;
          }
          e = e.nextSibling;
        }
        fr = null;
      }
    } else fr = dr ? An(e.stateNode.nextSibling) : null;
    return !0;
  }
  function Ym() {
    for (var e = fr; e; ) e = An(e.nextSibling);
  }
  function Bi() {
    (fr = dr = null), (rt = !1);
  }
  function su(e) {
    Ar === null ? (Ar = [e]) : Ar.push(e);
  }
  var PE = H.ReactCurrentBatchConfig;
  function Bo(e, t, s) {
    if (((e = s.ref), e !== null && typeof e != 'function' && typeof e != 'object')) {
      if (s._owner) {
        if (((s = s._owner), s)) {
          if (s.tag !== 1) throw Error(n(309));
          var u = s.stateNode;
        }
        if (!u) throw Error(n(147, e));
        var f = u,
          p = '' + e;
        return t !== null && t.ref !== null && typeof t.ref == 'function' && t.ref._stringRef === p
          ? t.ref
          : ((t = function (v) {
              var C = f.refs;
              v === null ? delete C[p] : (C[p] = v);
            }),
            (t._stringRef = p),
            t);
      }
      if (typeof e != 'string') throw Error(n(284));
      if (!s._owner) throw Error(n(290, e));
    }
    return e;
  }
  function cs(e, t) {
    throw (
      ((e = Object.prototype.toString.call(t)),
      Error(n(31, e === '[object Object]' ? 'object with keys {' + Object.keys(t).join(', ') + '}' : e)))
    );
  }
  function Qm(e) {
    var t = e._init;
    return t(e._payload);
  }
  function Zm(e) {
    function t(D, N) {
      if (e) {
        var M = D.deletions;
        M === null ? ((D.deletions = [N]), (D.flags |= 16)) : M.push(N);
      }
    }
    function s(D, N) {
      if (!e) return null;
      for (; N !== null; ) t(D, N), (N = N.sibling);
      return null;
    }
    function u(D, N) {
      for (D = new Map(); N !== null; ) N.key !== null ? D.set(N.key, N) : D.set(N.index, N), (N = N.sibling);
      return D;
    }
    function f(D, N) {
      return (D = Hn(D, N)), (D.index = 0), (D.sibling = null), D;
    }
    function p(D, N, M) {
      return (
        (D.index = M),
        e
          ? ((M = D.alternate), M !== null ? ((M = M.index), M < N ? ((D.flags |= 2), N) : M) : ((D.flags |= 2), N))
          : ((D.flags |= 1048576), N)
      );
    }
    function v(D) {
      return e && D.alternate === null && (D.flags |= 2), D;
    }
    function C(D, N, M, re) {
      return N === null || N.tag !== 6
        ? ((N = Zu(M, D.mode, re)), (N.return = D), N)
        : ((N = f(N, M)), (N.return = D), N);
    }
    function R(D, N, M, re) {
      var _e = M.type;
      return _e === b
        ? Q(D, N, M.props.children, re, M.key)
        : N !== null &&
          (N.elementType === _e || (typeof _e == 'object' && _e !== null && _e.$$typeof === be && Qm(_e) === N.type))
        ? ((re = f(N, M.props)), (re.ref = Bo(D, N, M)), (re.return = D), re)
        : ((re = Ls(M.type, M.key, M.props, null, D.mode, re)), (re.ref = Bo(D, N, M)), (re.return = D), re);
    }
    function B(D, N, M, re) {
      return N === null ||
        N.tag !== 4 ||
        N.stateNode.containerInfo !== M.containerInfo ||
        N.stateNode.implementation !== M.implementation
        ? ((N = Ju(M, D.mode, re)), (N.return = D), N)
        : ((N = f(N, M.children || [])), (N.return = D), N);
    }
    function Q(D, N, M, re, _e) {
      return N === null || N.tag !== 7
        ? ((N = vi(M, D.mode, re, _e)), (N.return = D), N)
        : ((N = f(N, M)), (N.return = D), N);
    }
    function J(D, N, M) {
      if ((typeof N == 'string' && N !== '') || typeof N == 'number')
        return (N = Zu('' + N, D.mode, M)), (N.return = D), N;
      if (typeof N == 'object' && N !== null) {
        switch (N.$$typeof) {
          case V:
            return (M = Ls(N.type, N.key, N.props, null, D.mode, M)), (M.ref = Bo(D, null, N)), (M.return = D), M;
          case F:
            return (N = Ju(N, D.mode, M)), (N.return = D), N;
          case be:
            var re = N._init;
            return J(D, re(N._payload), M);
        }
        if (St(N) || te(N)) return (N = vi(N, D.mode, M, null)), (N.return = D), N;
        cs(D, N);
      }
      return null;
    }
    function Y(D, N, M, re) {
      var _e = N !== null ? N.key : null;
      if ((typeof M == 'string' && M !== '') || typeof M == 'number') return _e !== null ? null : C(D, N, '' + M, re);
      if (typeof M == 'object' && M !== null) {
        switch (M.$$typeof) {
          case V:
            return M.key === _e ? R(D, N, M, re) : null;
          case F:
            return M.key === _e ? B(D, N, M, re) : null;
          case be:
            return (_e = M._init), Y(D, N, _e(M._payload), re);
        }
        if (St(M) || te(M)) return _e !== null ? null : Q(D, N, M, re, null);
        cs(D, M);
      }
      return null;
    }
    function ae(D, N, M, re, _e) {
      if ((typeof re == 'string' && re !== '') || typeof re == 'number')
        return (D = D.get(M) || null), C(N, D, '' + re, _e);
      if (typeof re == 'object' && re !== null) {
        switch (re.$$typeof) {
          case V:
            return (D = D.get(re.key === null ? M : re.key) || null), R(N, D, re, _e);
          case F:
            return (D = D.get(re.key === null ? M : re.key) || null), B(N, D, re, _e);
          case be:
            var Oe = re._init;
            return ae(D, N, M, Oe(re._payload), _e);
        }
        if (St(re) || te(re)) return (D = D.get(M) || null), Q(N, D, re, _e, null);
        cs(N, re);
      }
      return null;
    }
    function he(D, N, M, re) {
      for (var _e = null, Oe = null, xe = N, Ie = (N = 0), xt = null; xe !== null && Ie < M.length; Ie++) {
        xe.index > Ie ? ((xt = xe), (xe = null)) : (xt = xe.sibling);
        var Ue = Y(D, xe, M[Ie], re);
        if (Ue === null) {
          xe === null && (xe = xt);
          break;
        }
        e && xe && Ue.alternate === null && t(D, xe),
          (N = p(Ue, N, Ie)),
          Oe === null ? (_e = Ue) : (Oe.sibling = Ue),
          (Oe = Ue),
          (xe = xt);
      }
      if (Ie === M.length) return s(D, xe), rt && ci(D, Ie), _e;
      if (xe === null) {
        for (; Ie < M.length; Ie++)
          (xe = J(D, M[Ie], re)),
            xe !== null && ((N = p(xe, N, Ie)), Oe === null ? (_e = xe) : (Oe.sibling = xe), (Oe = xe));
        return rt && ci(D, Ie), _e;
      }
      for (xe = u(D, xe); Ie < M.length; Ie++)
        (xt = ae(xe, D, Ie, M[Ie], re)),
          xt !== null &&
            (e && xt.alternate !== null && xe.delete(xt.key === null ? Ie : xt.key),
            (N = p(xt, N, Ie)),
            Oe === null ? (_e = xt) : (Oe.sibling = xt),
            (Oe = xt));
      return (
        e &&
          xe.forEach(function (Kn) {
            return t(D, Kn);
          }),
        rt && ci(D, Ie),
        _e
      );
    }
    function ge(D, N, M, re) {
      var _e = te(M);
      if (typeof _e != 'function') throw Error(n(150));
      if (((M = _e.call(M)), M == null)) throw Error(n(151));
      for (
        var Oe = (_e = null), xe = N, Ie = (N = 0), xt = null, Ue = M.next();
        xe !== null && !Ue.done;
        Ie++, Ue = M.next()
      ) {
        xe.index > Ie ? ((xt = xe), (xe = null)) : (xt = xe.sibling);
        var Kn = Y(D, xe, Ue.value, re);
        if (Kn === null) {
          xe === null && (xe = xt);
          break;
        }
        e && xe && Kn.alternate === null && t(D, xe),
          (N = p(Kn, N, Ie)),
          Oe === null ? (_e = Kn) : (Oe.sibling = Kn),
          (Oe = Kn),
          (xe = xt);
      }
      if (Ue.done) return s(D, xe), rt && ci(D, Ie), _e;
      if (xe === null) {
        for (; !Ue.done; Ie++, Ue = M.next())
          (Ue = J(D, Ue.value, re)),
            Ue !== null && ((N = p(Ue, N, Ie)), Oe === null ? (_e = Ue) : (Oe.sibling = Ue), (Oe = Ue));
        return rt && ci(D, Ie), _e;
      }
      for (xe = u(D, xe); !Ue.done; Ie++, Ue = M.next())
        (Ue = ae(xe, D, Ie, Ue.value, re)),
          Ue !== null &&
            (e && Ue.alternate !== null && xe.delete(Ue.key === null ? Ie : Ue.key),
            (N = p(Ue, N, Ie)),
            Oe === null ? (_e = Ue) : (Oe.sibling = Ue),
            (Oe = Ue));
      return (
        e &&
          xe.forEach(function (ab) {
            return t(D, ab);
          }),
        rt && ci(D, Ie),
        _e
      );
    }
    function pt(D, N, M, re) {
      if (
        (typeof M == 'object' && M !== null && M.type === b && M.key === null && (M = M.props.children),
        typeof M == 'object' && M !== null)
      ) {
        switch (M.$$typeof) {
          case V:
            e: {
              for (var _e = M.key, Oe = N; Oe !== null; ) {
                if (Oe.key === _e) {
                  if (((_e = M.type), _e === b)) {
                    if (Oe.tag === 7) {
                      s(D, Oe.sibling), (N = f(Oe, M.props.children)), (N.return = D), (D = N);
                      break e;
                    }
                  } else if (
                    Oe.elementType === _e ||
                    (typeof _e == 'object' && _e !== null && _e.$$typeof === be && Qm(_e) === Oe.type)
                  ) {
                    s(D, Oe.sibling), (N = f(Oe, M.props)), (N.ref = Bo(D, Oe, M)), (N.return = D), (D = N);
                    break e;
                  }
                  s(D, Oe);
                  break;
                } else t(D, Oe);
                Oe = Oe.sibling;
              }
              M.type === b
                ? ((N = vi(M.props.children, D.mode, re, M.key)), (N.return = D), (D = N))
                : ((re = Ls(M.type, M.key, M.props, null, D.mode, re)),
                  (re.ref = Bo(D, N, M)),
                  (re.return = D),
                  (D = re));
            }
            return v(D);
          case F:
            e: {
              for (Oe = M.key; N !== null; ) {
                if (N.key === Oe)
                  if (
                    N.tag === 4 &&
                    N.stateNode.containerInfo === M.containerInfo &&
                    N.stateNode.implementation === M.implementation
                  ) {
                    s(D, N.sibling), (N = f(N, M.children || [])), (N.return = D), (D = N);
                    break e;
                  } else {
                    s(D, N);
                    break;
                  }
                else t(D, N);
                N = N.sibling;
              }
              (N = Ju(M, D.mode, re)), (N.return = D), (D = N);
            }
            return v(D);
          case be:
            return (Oe = M._init), pt(D, N, Oe(M._payload), re);
        }
        if (St(M)) return he(D, N, M, re);
        if (te(M)) return ge(D, N, M, re);
        cs(D, M);
      }
      return (typeof M == 'string' && M !== '') || typeof M == 'number'
        ? ((M = '' + M),
          N !== null && N.tag === 6
            ? (s(D, N.sibling), (N = f(N, M)), (N.return = D), (D = N))
            : (s(D, N), (N = Zu(M, D.mode, re)), (N.return = D), (D = N)),
          v(D))
        : s(D, N);
    }
    return pt;
  }
  var Ui = Zm(!0),
    Jm = Zm(!1),
    ds = Ln(null),
    fs = null,
    Hi = null,
    lu = null;
  function uu() {
    lu = Hi = fs = null;
  }
  function cu(e) {
    var t = ds.current;
    et(ds), (e._currentValue = t);
  }
  function du(e, t, s) {
    for (; e !== null; ) {
      var u = e.alternate;
      if (
        ((e.childLanes & t) !== t
          ? ((e.childLanes |= t), u !== null && (u.childLanes |= t))
          : u !== null && (u.childLanes & t) !== t && (u.childLanes |= t),
        e === s)
      )
        break;
      e = e.return;
    }
  }
  function Ki(e, t) {
    (fs = e),
      (lu = Hi = null),
      (e = e.dependencies),
      e !== null && e.firstContext !== null && ((e.lanes & t) !== 0 && (Jt = !0), (e.firstContext = null));
  }
  function Sr(e) {
    var t = e._currentValue;
    if (lu !== e)
      if (((e = { context: e, memoizedValue: t, next: null }), Hi === null)) {
        if (fs === null) throw Error(n(308));
        (Hi = e), (fs.dependencies = { lanes: 0, firstContext: e });
      } else Hi = Hi.next = e;
    return t;
  }
  var di = null;
  function fu(e) {
    di === null ? (di = [e]) : di.push(e);
  }
  function eg(e, t, s, u) {
    var f = t.interleaved;
    return f === null ? ((s.next = s), fu(t)) : ((s.next = f.next), (f.next = s)), (t.interleaved = s), mn(e, u);
  }
  function mn(e, t) {
    e.lanes |= t;
    var s = e.alternate;
    for (s !== null && (s.lanes |= t), s = e, e = e.return; e !== null; )
      (e.childLanes |= t), (s = e.alternate), s !== null && (s.childLanes |= t), (s = e), (e = e.return);
    return s.tag === 3 ? s.stateNode : null;
  }
  var Mn = !1;
  function pu(e) {
    e.updateQueue = {
      baseState: e.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, interleaved: null, lanes: 0 },
      effects: null,
    };
  }
  function tg(e, t) {
    (e = e.updateQueue),
      t.updateQueue === e &&
        (t.updateQueue = {
          baseState: e.baseState,
          firstBaseUpdate: e.firstBaseUpdate,
          lastBaseUpdate: e.lastBaseUpdate,
          shared: e.shared,
          effects: e.effects,
        });
  }
  function gn(e, t) {
    return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
  }
  function Fn(e, t, s) {
    var u = e.updateQueue;
    if (u === null) return null;
    if (((u = u.shared), (Be & 2) !== 0)) {
      var f = u.pending;
      return f === null ? (t.next = t) : ((t.next = f.next), (f.next = t)), (u.pending = t), mn(e, s);
    }
    return (
      (f = u.interleaved),
      f === null ? ((t.next = t), fu(u)) : ((t.next = f.next), (f.next = t)),
      (u.interleaved = t),
      mn(e, s)
    );
  }
  function ps(e, t, s) {
    if (((t = t.updateQueue), t !== null && ((t = t.shared), (s & 4194240) !== 0))) {
      var u = t.lanes;
      (u &= e.pendingLanes), (s |= u), (t.lanes = s), Pl(e, s);
    }
  }
  function rg(e, t) {
    var s = e.updateQueue,
      u = e.alternate;
    if (u !== null && ((u = u.updateQueue), s === u)) {
      var f = null,
        p = null;
      if (((s = s.firstBaseUpdate), s !== null)) {
        do {
          var v = {
            eventTime: s.eventTime,
            lane: s.lane,
            tag: s.tag,
            payload: s.payload,
            callback: s.callback,
            next: null,
          };
          p === null ? (f = p = v) : (p = p.next = v), (s = s.next);
        } while (s !== null);
        p === null ? (f = p = t) : (p = p.next = t);
      } else f = p = t;
      (s = { baseState: u.baseState, firstBaseUpdate: f, lastBaseUpdate: p, shared: u.shared, effects: u.effects }),
        (e.updateQueue = s);
      return;
    }
    (e = s.lastBaseUpdate), e === null ? (s.firstBaseUpdate = t) : (e.next = t), (s.lastBaseUpdate = t);
  }
  function hs(e, t, s, u) {
    var f = e.updateQueue;
    Mn = !1;
    var p = f.firstBaseUpdate,
      v = f.lastBaseUpdate,
      C = f.shared.pending;
    if (C !== null) {
      f.shared.pending = null;
      var R = C,
        B = R.next;
      (R.next = null), v === null ? (p = B) : (v.next = B), (v = R);
      var Q = e.alternate;
      Q !== null &&
        ((Q = Q.updateQueue),
        (C = Q.lastBaseUpdate),
        C !== v && (C === null ? (Q.firstBaseUpdate = B) : (C.next = B), (Q.lastBaseUpdate = R)));
    }
    if (p !== null) {
      var J = f.baseState;
      (v = 0), (Q = B = R = null), (C = p);
      do {
        var Y = C.lane,
          ae = C.eventTime;
        if ((u & Y) === Y) {
          Q !== null &&
            (Q = Q.next = { eventTime: ae, lane: 0, tag: C.tag, payload: C.payload, callback: C.callback, next: null });
          e: {
            var he = e,
              ge = C;
            switch (((Y = t), (ae = s), ge.tag)) {
              case 1:
                if (((he = ge.payload), typeof he == 'function')) {
                  J = he.call(ae, J, Y);
                  break e;
                }
                J = he;
                break e;
              case 3:
                he.flags = (he.flags & -65537) | 128;
              case 0:
                if (((he = ge.payload), (Y = typeof he == 'function' ? he.call(ae, J, Y) : he), Y == null)) break e;
                J = ee({}, J, Y);
                break e;
              case 2:
                Mn = !0;
            }
          }
          C.callback !== null &&
            C.lane !== 0 &&
            ((e.flags |= 64), (Y = f.effects), Y === null ? (f.effects = [C]) : Y.push(C));
        } else
          (ae = { eventTime: ae, lane: Y, tag: C.tag, payload: C.payload, callback: C.callback, next: null }),
            Q === null ? ((B = Q = ae), (R = J)) : (Q = Q.next = ae),
            (v |= Y);
        if (((C = C.next), C === null)) {
          if (((C = f.shared.pending), C === null)) break;
          (Y = C), (C = Y.next), (Y.next = null), (f.lastBaseUpdate = Y), (f.shared.pending = null);
        }
      } while (!0);
      if (
        (Q === null && (R = J),
        (f.baseState = R),
        (f.firstBaseUpdate = B),
        (f.lastBaseUpdate = Q),
        (t = f.shared.interleaved),
        t !== null)
      ) {
        f = t;
        do (v |= f.lane), (f = f.next);
        while (f !== t);
      } else p === null && (f.shared.lanes = 0);
      (hi |= v), (e.lanes = v), (e.memoizedState = J);
    }
  }
  function ng(e, t, s) {
    if (((e = t.effects), (t.effects = null), e !== null))
      for (t = 0; t < e.length; t++) {
        var u = e[t],
          f = u.callback;
        if (f !== null) {
          if (((u.callback = null), (u = s), typeof f != 'function')) throw Error(n(191, f));
          f.call(u);
        }
      }
  }
  var Uo = {},
    Xr = Ln(Uo),
    Ho = Ln(Uo),
    Ko = Ln(Uo);
  function fi(e) {
    if (e === Uo) throw Error(n(174));
    return e;
  }
  function hu(e, t) {
    switch ((Qe(Ko, t), Qe(Ho, e), Qe(Xr, Uo), (e = t.nodeType), e)) {
      case 9:
      case 11:
        t = (t = t.documentElement) ? t.namespaceURI : ar(null, '');
        break;
      default:
        (e = e === 8 ? t.parentNode : t), (t = e.namespaceURI || null), (e = e.tagName), (t = ar(t, e));
    }
    et(Xr), Qe(Xr, t);
  }
  function Vi() {
    et(Xr), et(Ho), et(Ko);
  }
  function ig(e) {
    fi(Ko.current);
    var t = fi(Xr.current),
      s = ar(t, e.type);
    t !== s && (Qe(Ho, e), Qe(Xr, s));
  }
  function mu(e) {
    Ho.current === e && (et(Xr), et(Ho));
  }
  var st = Ln(0);
  function ms(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var s = t.memoizedState;
        if (s !== null && ((s = s.dehydrated), s === null || s.data === '$?' || s.data === '$!')) return t;
      } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
        if ((t.flags & 128) !== 0) return t;
      } else if (t.child !== null) {
        (t.child.return = t), (t = t.child);
        continue;
      }
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return null;
        t = t.return;
      }
      (t.sibling.return = t.return), (t = t.sibling);
    }
    return null;
  }
  var gu = [];
  function yu() {
    for (var e = 0; e < gu.length; e++) gu[e]._workInProgressVersionPrimary = null;
    gu.length = 0;
  }
  var gs = H.ReactCurrentDispatcher,
    vu = H.ReactCurrentBatchConfig,
    pi = 0,
    lt = null,
    wt = null,
    Ct = null,
    ys = !1,
    Vo = !1,
    Wo = 0,
    TE = 0;
  function Dt() {
    throw Error(n(321));
  }
  function wu(e, t) {
    if (t === null) return !1;
    for (var s = 0; s < t.length && s < e.length; s++) if (!kr(e[s], t[s])) return !1;
    return !0;
  }
  function _u(e, t, s, u, f, p) {
    if (
      ((pi = p),
      (lt = t),
      (t.memoizedState = null),
      (t.updateQueue = null),
      (t.lanes = 0),
      (gs.current = e === null || e.memoizedState === null ? kE : AE),
      (e = s(u, f)),
      Vo)
    ) {
      p = 0;
      do {
        if (((Vo = !1), (Wo = 0), 25 <= p)) throw Error(n(301));
        (p += 1), (Ct = wt = null), (t.updateQueue = null), (gs.current = LE), (e = s(u, f));
      } while (Vo);
    }
    if (((gs.current = _s), (t = wt !== null && wt.next !== null), (pi = 0), (Ct = wt = lt = null), (ys = !1), t))
      throw Error(n(300));
    return e;
  }
  function Su() {
    var e = Wo !== 0;
    return (Wo = 0), e;
  }
  function Yr() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return Ct === null ? (lt.memoizedState = Ct = e) : (Ct = Ct.next = e), Ct;
  }
  function Er() {
    if (wt === null) {
      var e = lt.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = wt.next;
    var t = Ct === null ? lt.memoizedState : Ct.next;
    if (t !== null) (Ct = t), (wt = e);
    else {
      if (e === null) throw Error(n(310));
      (wt = e),
        (e = {
          memoizedState: wt.memoizedState,
          baseState: wt.baseState,
          baseQueue: wt.baseQueue,
          queue: wt.queue,
          next: null,
        }),
        Ct === null ? (lt.memoizedState = Ct = e) : (Ct = Ct.next = e);
    }
    return Ct;
  }
  function Go(e, t) {
    return typeof t == 'function' ? t(e) : t;
  }
  function Eu(e) {
    var t = Er(),
      s = t.queue;
    if (s === null) throw Error(n(311));
    s.lastRenderedReducer = e;
    var u = wt,
      f = u.baseQueue,
      p = s.pending;
    if (p !== null) {
      if (f !== null) {
        var v = f.next;
        (f.next = p.next), (p.next = v);
      }
      (u.baseQueue = f = p), (s.pending = null);
    }
    if (f !== null) {
      (p = f.next), (u = u.baseState);
      var C = (v = null),
        R = null,
        B = p;
      do {
        var Q = B.lane;
        if ((pi & Q) === Q)
          R !== null &&
            (R = R.next =
              { lane: 0, action: B.action, hasEagerState: B.hasEagerState, eagerState: B.eagerState, next: null }),
            (u = B.hasEagerState ? B.eagerState : e(u, B.action));
        else {
          var J = { lane: Q, action: B.action, hasEagerState: B.hasEagerState, eagerState: B.eagerState, next: null };
          R === null ? ((C = R = J), (v = u)) : (R = R.next = J), (lt.lanes |= Q), (hi |= Q);
        }
        B = B.next;
      } while (B !== null && B !== p);
      R === null ? (v = u) : (R.next = C),
        kr(u, t.memoizedState) || (Jt = !0),
        (t.memoizedState = u),
        (t.baseState = v),
        (t.baseQueue = R),
        (s.lastRenderedState = u);
    }
    if (((e = s.interleaved), e !== null)) {
      f = e;
      do (p = f.lane), (lt.lanes |= p), (hi |= p), (f = f.next);
      while (f !== e);
    } else f === null && (s.lanes = 0);
    return [t.memoizedState, s.dispatch];
  }
  function bu(e) {
    var t = Er(),
      s = t.queue;
    if (s === null) throw Error(n(311));
    s.lastRenderedReducer = e;
    var u = s.dispatch,
      f = s.pending,
      p = t.memoizedState;
    if (f !== null) {
      s.pending = null;
      var v = (f = f.next);
      do (p = e(p, v.action)), (v = v.next);
      while (v !== f);
      kr(p, t.memoizedState) || (Jt = !0),
        (t.memoizedState = p),
        t.baseQueue === null && (t.baseState = p),
        (s.lastRenderedState = p);
    }
    return [p, u];
  }
  function og() {}
  function ag(e, t) {
    var s = lt,
      u = Er(),
      f = t(),
      p = !kr(u.memoizedState, f);
    if (
      (p && ((u.memoizedState = f), (Jt = !0)),
      (u = u.queue),
      Cu(ug.bind(null, s, u, e), [e]),
      u.getSnapshot !== t || p || (Ct !== null && Ct.memoizedState.tag & 1))
    ) {
      if (((s.flags |= 2048), Xo(9, lg.bind(null, s, u, f, t), void 0, null), Ot === null)) throw Error(n(349));
      (pi & 30) !== 0 || sg(s, t, f);
    }
    return f;
  }
  function sg(e, t, s) {
    (e.flags |= 16384),
      (e = { getSnapshot: t, value: s }),
      (t = lt.updateQueue),
      t === null
        ? ((t = { lastEffect: null, stores: null }), (lt.updateQueue = t), (t.stores = [e]))
        : ((s = t.stores), s === null ? (t.stores = [e]) : s.push(e));
  }
  function lg(e, t, s, u) {
    (t.value = s), (t.getSnapshot = u), cg(t) && dg(e);
  }
  function ug(e, t, s) {
    return s(function () {
      cg(t) && dg(e);
    });
  }
  function cg(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var s = t();
      return !kr(e, s);
    } catch {
      return !0;
    }
  }
  function dg(e) {
    var t = mn(e, 1);
    t !== null && Mr(t, e, 1, -1);
  }
  function fg(e) {
    var t = Yr();
    return (
      typeof e == 'function' && (e = e()),
      (t.memoizedState = t.baseState = e),
      (e = {
        pending: null,
        interleaved: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Go,
        lastRenderedState: e,
      }),
      (t.queue = e),
      (e = e.dispatch = NE.bind(null, lt, e)),
      [t.memoizedState, e]
    );
  }
  function Xo(e, t, s, u) {
    return (
      (e = { tag: e, create: t, destroy: s, deps: u, next: null }),
      (t = lt.updateQueue),
      t === null
        ? ((t = { lastEffect: null, stores: null }), (lt.updateQueue = t), (t.lastEffect = e.next = e))
        : ((s = t.lastEffect),
          s === null ? (t.lastEffect = e.next = e) : ((u = s.next), (s.next = e), (e.next = u), (t.lastEffect = e))),
      e
    );
  }
  function pg() {
    return Er().memoizedState;
  }
  function vs(e, t, s, u) {
    var f = Yr();
    (lt.flags |= e), (f.memoizedState = Xo(1 | t, s, void 0, u === void 0 ? null : u));
  }
  function ws(e, t, s, u) {
    var f = Er();
    u = u === void 0 ? null : u;
    var p = void 0;
    if (wt !== null) {
      var v = wt.memoizedState;
      if (((p = v.destroy), u !== null && wu(u, v.deps))) {
        f.memoizedState = Xo(t, s, p, u);
        return;
      }
    }
    (lt.flags |= e), (f.memoizedState = Xo(1 | t, s, p, u));
  }
  function hg(e, t) {
    return vs(8390656, 8, e, t);
  }
  function Cu(e, t) {
    return ws(2048, 8, e, t);
  }
  function mg(e, t) {
    return ws(4, 2, e, t);
  }
  function gg(e, t) {
    return ws(4, 4, e, t);
  }
  function yg(e, t) {
    if (typeof t == 'function')
      return (
        (e = e()),
        t(e),
        function () {
          t(null);
        }
      );
    if (t != null)
      return (
        (e = e()),
        (t.current = e),
        function () {
          t.current = null;
        }
      );
  }
  function vg(e, t, s) {
    return (s = s != null ? s.concat([e]) : null), ws(4, 4, yg.bind(null, t, e), s);
  }
  function Ou() {}
  function wg(e, t) {
    var s = Er();
    t = t === void 0 ? null : t;
    var u = s.memoizedState;
    return u !== null && t !== null && wu(t, u[1]) ? u[0] : ((s.memoizedState = [e, t]), e);
  }
  function _g(e, t) {
    var s = Er();
    t = t === void 0 ? null : t;
    var u = s.memoizedState;
    return u !== null && t !== null && wu(t, u[1]) ? u[0] : ((e = e()), (s.memoizedState = [e, t]), e);
  }
  function Sg(e, t, s) {
    return (pi & 21) === 0
      ? (e.baseState && ((e.baseState = !1), (Jt = !0)), (e.memoizedState = s))
      : (kr(s, t) || ((s = Qh()), (lt.lanes |= s), (hi |= s), (e.baseState = !0)), t);
  }
  function RE(e, t) {
    var s = We;
    (We = s !== 0 && 4 > s ? s : 4), e(!0);
    var u = vu.transition;
    vu.transition = {};
    try {
      e(!1), t();
    } finally {
      (We = s), (vu.transition = u);
    }
  }
  function Eg() {
    return Er().memoizedState;
  }
  function IE(e, t, s) {
    var u = Bn(e);
    if (((s = { lane: u, action: s, hasEagerState: !1, eagerState: null, next: null }), bg(e))) Cg(t, s);
    else if (((s = eg(e, t, s, u)), s !== null)) {
      var f = Wt();
      Mr(s, e, u, f), Og(s, t, u);
    }
  }
  function NE(e, t, s) {
    var u = Bn(e),
      f = { lane: u, action: s, hasEagerState: !1, eagerState: null, next: null };
    if (bg(e)) Cg(t, f);
    else {
      var p = e.alternate;
      if (e.lanes === 0 && (p === null || p.lanes === 0) && ((p = t.lastRenderedReducer), p !== null))
        try {
          var v = t.lastRenderedState,
            C = p(v, s);
          if (((f.hasEagerState = !0), (f.eagerState = C), kr(C, v))) {
            var R = t.interleaved;
            R === null ? ((f.next = f), fu(t)) : ((f.next = R.next), (R.next = f)), (t.interleaved = f);
            return;
          }
        } catch {}
      (s = eg(e, t, f, u)), s !== null && ((f = Wt()), Mr(s, e, u, f), Og(s, t, u));
    }
  }
  function bg(e) {
    var t = e.alternate;
    return e === lt || (t !== null && t === lt);
  }
  function Cg(e, t) {
    Vo = ys = !0;
    var s = e.pending;
    s === null ? (t.next = t) : ((t.next = s.next), (s.next = t)), (e.pending = t);
  }
  function Og(e, t, s) {
    if ((s & 4194240) !== 0) {
      var u = t.lanes;
      (u &= e.pendingLanes), (s |= u), (t.lanes = s), Pl(e, s);
    }
  }
  var _s = {
      readContext: Sr,
      useCallback: Dt,
      useContext: Dt,
      useEffect: Dt,
      useImperativeHandle: Dt,
      useInsertionEffect: Dt,
      useLayoutEffect: Dt,
      useMemo: Dt,
      useReducer: Dt,
      useRef: Dt,
      useState: Dt,
      useDebugValue: Dt,
      useDeferredValue: Dt,
      useTransition: Dt,
      useMutableSource: Dt,
      useSyncExternalStore: Dt,
      useId: Dt,
      unstable_isNewReconciler: !1,
    },
    kE = {
      readContext: Sr,
      useCallback: function (e, t) {
        return (Yr().memoizedState = [e, t === void 0 ? null : t]), e;
      },
      useContext: Sr,
      useEffect: hg,
      useImperativeHandle: function (e, t, s) {
        return (s = s != null ? s.concat([e]) : null), vs(4194308, 4, yg.bind(null, t, e), s);
      },
      useLayoutEffect: function (e, t) {
        return vs(4194308, 4, e, t);
      },
      useInsertionEffect: function (e, t) {
        return vs(4, 2, e, t);
      },
      useMemo: function (e, t) {
        var s = Yr();
        return (t = t === void 0 ? null : t), (e = e()), (s.memoizedState = [e, t]), e;
      },
      useReducer: function (e, t, s) {
        var u = Yr();
        return (
          (t = s !== void 0 ? s(t) : t),
          (u.memoizedState = u.baseState = t),
          (e = {
            pending: null,
            interleaved: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: e,
            lastRenderedState: t,
          }),
          (u.queue = e),
          (e = e.dispatch = IE.bind(null, lt, e)),
          [u.memoizedState, e]
        );
      },
      useRef: function (e) {
        var t = Yr();
        return (e = { current: e }), (t.memoizedState = e);
      },
      useState: fg,
      useDebugValue: Ou,
      useDeferredValue: function (e) {
        return (Yr().memoizedState = e);
      },
      useTransition: function () {
        var e = fg(!1),
          t = e[0];
        return (e = RE.bind(null, e[1])), (Yr().memoizedState = e), [t, e];
      },
      useMutableSource: function () {},
      useSyncExternalStore: function (e, t, s) {
        var u = lt,
          f = Yr();
        if (rt) {
          if (s === void 0) throw Error(n(407));
          s = s();
        } else {
          if (((s = t()), Ot === null)) throw Error(n(349));
          (pi & 30) !== 0 || sg(u, t, s);
        }
        f.memoizedState = s;
        var p = { value: s, getSnapshot: t };
        return (
          (f.queue = p),
          hg(ug.bind(null, u, p, e), [e]),
          (u.flags |= 2048),
          Xo(9, lg.bind(null, u, p, s, t), void 0, null),
          s
        );
      },
      useId: function () {
        var e = Yr(),
          t = Ot.identifierPrefix;
        if (rt) {
          var s = hn,
            u = pn;
          (s = (u & ~(1 << (32 - Xe(u) - 1))).toString(32) + s),
            (t = ':' + t + 'R' + s),
            (s = Wo++),
            0 < s && (t += 'H' + s.toString(32)),
            (t += ':');
        } else (s = TE++), (t = ':' + t + 'r' + s.toString(32) + ':');
        return (e.memoizedState = t);
      },
      unstable_isNewReconciler: !1,
    },
    AE = {
      readContext: Sr,
      useCallback: wg,
      useContext: Sr,
      useEffect: Cu,
      useImperativeHandle: vg,
      useInsertionEffect: mg,
      useLayoutEffect: gg,
      useMemo: _g,
      useReducer: Eu,
      useRef: pg,
      useState: function () {
        return Eu(Go);
      },
      useDebugValue: Ou,
      useDeferredValue: function (e) {
        var t = Er();
        return Sg(t, wt.memoizedState, e);
      },
      useTransition: function () {
        var e = Eu(Go)[0],
          t = Er().memoizedState;
        return [e, t];
      },
      useMutableSource: og,
      useSyncExternalStore: ag,
      useId: Eg,
      unstable_isNewReconciler: !1,
    },
    LE = {
      readContext: Sr,
      useCallback: wg,
      useContext: Sr,
      useEffect: Cu,
      useImperativeHandle: vg,
      useInsertionEffect: mg,
      useLayoutEffect: gg,
      useMemo: _g,
      useReducer: bu,
      useRef: pg,
      useState: function () {
        return bu(Go);
      },
      useDebugValue: Ou,
      useDeferredValue: function (e) {
        var t = Er();
        return wt === null ? (t.memoizedState = e) : Sg(t, wt.memoizedState, e);
      },
      useTransition: function () {
        var e = bu(Go)[0],
          t = Er().memoizedState;
        return [e, t];
      },
      useMutableSource: og,
      useSyncExternalStore: ag,
      useId: Eg,
      unstable_isNewReconciler: !1,
    };
  function Lr(e, t) {
    if (e && e.defaultProps) {
      (t = ee({}, t)), (e = e.defaultProps);
      for (var s in e) t[s] === void 0 && (t[s] = e[s]);
      return t;
    }
    return t;
  }
  function xu(e, t, s, u) {
    (t = e.memoizedState),
      (s = s(u, t)),
      (s = s == null ? t : ee({}, t, s)),
      (e.memoizedState = s),
      e.lanes === 0 && (e.updateQueue.baseState = s);
  }
  var Ss = {
    isMounted: function (e) {
      return (e = e._reactInternals) ? ve(e) === e : !1;
    },
    enqueueSetState: function (e, t, s) {
      e = e._reactInternals;
      var u = Wt(),
        f = Bn(e),
        p = gn(u, f);
      (p.payload = t), s != null && (p.callback = s), (t = Fn(e, p, f)), t !== null && (Mr(t, e, f, u), ps(t, e, f));
    },
    enqueueReplaceState: function (e, t, s) {
      e = e._reactInternals;
      var u = Wt(),
        f = Bn(e),
        p = gn(u, f);
      (p.tag = 1),
        (p.payload = t),
        s != null && (p.callback = s),
        (t = Fn(e, p, f)),
        t !== null && (Mr(t, e, f, u), ps(t, e, f));
    },
    enqueueForceUpdate: function (e, t) {
      e = e._reactInternals;
      var s = Wt(),
        u = Bn(e),
        f = gn(s, u);
      (f.tag = 2), t != null && (f.callback = t), (t = Fn(e, f, u)), t !== null && (Mr(t, e, u, s), ps(t, e, u));
    },
  };
  function xg(e, t, s, u, f, p, v) {
    return (
      (e = e.stateNode),
      typeof e.shouldComponentUpdate == 'function'
        ? e.shouldComponentUpdate(u, p, v)
        : t.prototype && t.prototype.isPureReactComponent
        ? !jo(s, u) || !jo(f, p)
        : !0
    );
  }
  function Pg(e, t, s) {
    var u = !1,
      f = jn,
      p = t.contextType;
    return (
      typeof p == 'object' && p !== null
        ? (p = Sr(p))
        : ((f = Zt(t) ? li : jt.current), (u = t.contextTypes), (p = (u = u != null) ? $i(e, f) : jn)),
      (t = new t(s, p)),
      (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
      (t.updater = Ss),
      (e.stateNode = t),
      (t._reactInternals = e),
      u &&
        ((e = e.stateNode),
        (e.__reactInternalMemoizedUnmaskedChildContext = f),
        (e.__reactInternalMemoizedMaskedChildContext = p)),
      t
    );
  }
  function Tg(e, t, s, u) {
    (e = t.state),
      typeof t.componentWillReceiveProps == 'function' && t.componentWillReceiveProps(s, u),
      typeof t.UNSAFE_componentWillReceiveProps == 'function' && t.UNSAFE_componentWillReceiveProps(s, u),
      t.state !== e && Ss.enqueueReplaceState(t, t.state, null);
  }
  function Pu(e, t, s, u) {
    var f = e.stateNode;
    (f.props = s), (f.state = e.memoizedState), (f.refs = {}), pu(e);
    var p = t.contextType;
    typeof p == 'object' && p !== null ? (f.context = Sr(p)) : ((p = Zt(t) ? li : jt.current), (f.context = $i(e, p))),
      (f.state = e.memoizedState),
      (p = t.getDerivedStateFromProps),
      typeof p == 'function' && (xu(e, t, p, s), (f.state = e.memoizedState)),
      typeof t.getDerivedStateFromProps == 'function' ||
        typeof f.getSnapshotBeforeUpdate == 'function' ||
        (typeof f.UNSAFE_componentWillMount != 'function' && typeof f.componentWillMount != 'function') ||
        ((t = f.state),
        typeof f.componentWillMount == 'function' && f.componentWillMount(),
        typeof f.UNSAFE_componentWillMount == 'function' && f.UNSAFE_componentWillMount(),
        t !== f.state && Ss.enqueueReplaceState(f, f.state, null),
        hs(e, s, f, u),
        (f.state = e.memoizedState)),
      typeof f.componentDidMount == 'function' && (e.flags |= 4194308);
  }
  function Wi(e, t) {
    try {
      var s = '',
        u = t;
      do (s += pe(u)), (u = u.return);
      while (u);
      var f = s;
    } catch (p) {
      f =
        `
Error generating stack: ` +
        p.message +
        `
` +
        p.stack;
    }
    return { value: e, source: t, stack: f, digest: null };
  }
  function Tu(e, t, s) {
    return { value: e, source: null, stack: s ?? null, digest: t ?? null };
  }
  function Ru(e, t) {
    try {
      console.error(t.value);
    } catch (s) {
      setTimeout(function () {
        throw s;
      });
    }
  }
  var jE = typeof WeakMap == 'function' ? WeakMap : Map;
  function Rg(e, t, s) {
    (s = gn(-1, s)), (s.tag = 3), (s.payload = { element: null });
    var u = t.value;
    return (
      (s.callback = function () {
        Ts || ((Ts = !0), (Hu = u)), Ru(e, t);
      }),
      s
    );
  }
  function Ig(e, t, s) {
    (s = gn(-1, s)), (s.tag = 3);
    var u = e.type.getDerivedStateFromError;
    if (typeof u == 'function') {
      var f = t.value;
      (s.payload = function () {
        return u(f);
      }),
        (s.callback = function () {
          Ru(e, t);
        });
    }
    var p = e.stateNode;
    return (
      p !== null &&
        typeof p.componentDidCatch == 'function' &&
        (s.callback = function () {
          Ru(e, t), typeof u != 'function' && (zn === null ? (zn = new Set([this])) : zn.add(this));
          var v = t.stack;
          this.componentDidCatch(t.value, { componentStack: v !== null ? v : '' });
        }),
      s
    );
  }
  function Ng(e, t, s) {
    var u = e.pingCache;
    if (u === null) {
      u = e.pingCache = new jE();
      var f = new Set();
      u.set(t, f);
    } else (f = u.get(t)), f === void 0 && ((f = new Set()), u.set(t, f));
    f.has(s) || (f.add(s), (e = XE.bind(null, e, t, s)), t.then(e, e));
  }
  function kg(e) {
    do {
      var t;
      if (((t = e.tag === 13) && ((t = e.memoizedState), (t = t !== null ? t.dehydrated !== null : !0)), t)) return e;
      e = e.return;
    } while (e !== null);
    return null;
  }
  function Ag(e, t, s, u, f) {
    return (e.mode & 1) === 0
      ? (e === t
          ? (e.flags |= 65536)
          : ((e.flags |= 128),
            (s.flags |= 131072),
            (s.flags &= -52805),
            s.tag === 1 && (s.alternate === null ? (s.tag = 17) : ((t = gn(-1, 1)), (t.tag = 2), Fn(s, t, 1))),
            (s.lanes |= 1)),
        e)
      : ((e.flags |= 65536), (e.lanes = f), e);
  }
  var DE = H.ReactCurrentOwner,
    Jt = !1;
  function Vt(e, t, s, u) {
    t.child = e === null ? Jm(t, null, s, u) : Ui(t, e.child, s, u);
  }
  function Lg(e, t, s, u, f) {
    s = s.render;
    var p = t.ref;
    return (
      Ki(t, f),
      (u = _u(e, t, s, u, p, f)),
      (s = Su()),
      e !== null && !Jt
        ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~f), yn(e, t, f))
        : (rt && s && nu(t), (t.flags |= 1), Vt(e, t, u, f), t.child)
    );
  }
  function jg(e, t, s, u, f) {
    if (e === null) {
      var p = s.type;
      return typeof p == 'function' &&
        !Qu(p) &&
        p.defaultProps === void 0 &&
        s.compare === null &&
        s.defaultProps === void 0
        ? ((t.tag = 15), (t.type = p), Dg(e, t, p, u, f))
        : ((e = Ls(s.type, null, u, t, t.mode, f)), (e.ref = t.ref), (e.return = t), (t.child = e));
    }
    if (((p = e.child), (e.lanes & f) === 0)) {
      var v = p.memoizedProps;
      if (((s = s.compare), (s = s !== null ? s : jo), s(v, u) && e.ref === t.ref)) return yn(e, t, f);
    }
    return (t.flags |= 1), (e = Hn(p, u)), (e.ref = t.ref), (e.return = t), (t.child = e);
  }
  function Dg(e, t, s, u, f) {
    if (e !== null) {
      var p = e.memoizedProps;
      if (jo(p, u) && e.ref === t.ref)
        if (((Jt = !1), (t.pendingProps = u = p), (e.lanes & f) !== 0)) (e.flags & 131072) !== 0 && (Jt = !0);
        else return (t.lanes = e.lanes), yn(e, t, f);
    }
    return Iu(e, t, s, u, f);
  }
  function Mg(e, t, s) {
    var u = t.pendingProps,
      f = u.children,
      p = e !== null ? e.memoizedState : null;
    if (u.mode === 'hidden')
      if ((t.mode & 1) === 0)
        (t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }), Qe(Xi, pr), (pr |= s);
      else {
        if ((s & 1073741824) === 0)
          return (
            (e = p !== null ? p.baseLanes | s : s),
            (t.lanes = t.childLanes = 1073741824),
            (t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }),
            (t.updateQueue = null),
            Qe(Xi, pr),
            (pr |= e),
            null
          );
        (t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
          (u = p !== null ? p.baseLanes : s),
          Qe(Xi, pr),
          (pr |= u);
      }
    else p !== null ? ((u = p.baseLanes | s), (t.memoizedState = null)) : (u = s), Qe(Xi, pr), (pr |= u);
    return Vt(e, t, f, s), t.child;
  }
  function Fg(e, t) {
    var s = t.ref;
    ((e === null && s !== null) || (e !== null && e.ref !== s)) && ((t.flags |= 512), (t.flags |= 2097152));
  }
  function Iu(e, t, s, u, f) {
    var p = Zt(s) ? li : jt.current;
    return (
      (p = $i(t, p)),
      Ki(t, f),
      (s = _u(e, t, s, u, p, f)),
      (u = Su()),
      e !== null && !Jt
        ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~f), yn(e, t, f))
        : (rt && u && nu(t), (t.flags |= 1), Vt(e, t, s, f), t.child)
    );
  }
  function $g(e, t, s, u, f) {
    if (Zt(s)) {
      var p = !0;
      os(t);
    } else p = !1;
    if ((Ki(t, f), t.stateNode === null)) bs(e, t), Pg(t, s, u), Pu(t, s, u, f), (u = !0);
    else if (e === null) {
      var v = t.stateNode,
        C = t.memoizedProps;
      v.props = C;
      var R = v.context,
        B = s.contextType;
      typeof B == 'object' && B !== null ? (B = Sr(B)) : ((B = Zt(s) ? li : jt.current), (B = $i(t, B)));
      var Q = s.getDerivedStateFromProps,
        J = typeof Q == 'function' || typeof v.getSnapshotBeforeUpdate == 'function';
      J ||
        (typeof v.UNSAFE_componentWillReceiveProps != 'function' && typeof v.componentWillReceiveProps != 'function') ||
        ((C !== u || R !== B) && Tg(t, v, u, B)),
        (Mn = !1);
      var Y = t.memoizedState;
      (v.state = Y),
        hs(t, u, v, f),
        (R = t.memoizedState),
        C !== u || Y !== R || Qt.current || Mn
          ? (typeof Q == 'function' && (xu(t, s, Q, u), (R = t.memoizedState)),
            (C = Mn || xg(t, s, C, u, Y, R, B))
              ? (J ||
                  (typeof v.UNSAFE_componentWillMount != 'function' && typeof v.componentWillMount != 'function') ||
                  (typeof v.componentWillMount == 'function' && v.componentWillMount(),
                  typeof v.UNSAFE_componentWillMount == 'function' && v.UNSAFE_componentWillMount()),
                typeof v.componentDidMount == 'function' && (t.flags |= 4194308))
              : (typeof v.componentDidMount == 'function' && (t.flags |= 4194308),
                (t.memoizedProps = u),
                (t.memoizedState = R)),
            (v.props = u),
            (v.state = R),
            (v.context = B),
            (u = C))
          : (typeof v.componentDidMount == 'function' && (t.flags |= 4194308), (u = !1));
    } else {
      (v = t.stateNode),
        tg(e, t),
        (C = t.memoizedProps),
        (B = t.type === t.elementType ? C : Lr(t.type, C)),
        (v.props = B),
        (J = t.pendingProps),
        (Y = v.context),
        (R = s.contextType),
        typeof R == 'object' && R !== null ? (R = Sr(R)) : ((R = Zt(s) ? li : jt.current), (R = $i(t, R)));
      var ae = s.getDerivedStateFromProps;
      (Q = typeof ae == 'function' || typeof v.getSnapshotBeforeUpdate == 'function') ||
        (typeof v.UNSAFE_componentWillReceiveProps != 'function' && typeof v.componentWillReceiveProps != 'function') ||
        ((C !== J || Y !== R) && Tg(t, v, u, R)),
        (Mn = !1),
        (Y = t.memoizedState),
        (v.state = Y),
        hs(t, u, v, f);
      var he = t.memoizedState;
      C !== J || Y !== he || Qt.current || Mn
        ? (typeof ae == 'function' && (xu(t, s, ae, u), (he = t.memoizedState)),
          (B = Mn || xg(t, s, B, u, Y, he, R) || !1)
            ? (Q ||
                (typeof v.UNSAFE_componentWillUpdate != 'function' && typeof v.componentWillUpdate != 'function') ||
                (typeof v.componentWillUpdate == 'function' && v.componentWillUpdate(u, he, R),
                typeof v.UNSAFE_componentWillUpdate == 'function' && v.UNSAFE_componentWillUpdate(u, he, R)),
              typeof v.componentDidUpdate == 'function' && (t.flags |= 4),
              typeof v.getSnapshotBeforeUpdate == 'function' && (t.flags |= 1024))
            : (typeof v.componentDidUpdate != 'function' ||
                (C === e.memoizedProps && Y === e.memoizedState) ||
                (t.flags |= 4),
              typeof v.getSnapshotBeforeUpdate != 'function' ||
                (C === e.memoizedProps && Y === e.memoizedState) ||
                (t.flags |= 1024),
              (t.memoizedProps = u),
              (t.memoizedState = he)),
          (v.props = u),
          (v.state = he),
          (v.context = R),
          (u = B))
        : (typeof v.componentDidUpdate != 'function' ||
            (C === e.memoizedProps && Y === e.memoizedState) ||
            (t.flags |= 4),
          typeof v.getSnapshotBeforeUpdate != 'function' ||
            (C === e.memoizedProps && Y === e.memoizedState) ||
            (t.flags |= 1024),
          (u = !1));
    }
    return Nu(e, t, s, u, p, f);
  }
  function Nu(e, t, s, u, f, p) {
    Fg(e, t);
    var v = (t.flags & 128) !== 0;
    if (!u && !v) return f && Hm(t, s, !1), yn(e, t, p);
    (u = t.stateNode), (DE.current = t);
    var C = v && typeof s.getDerivedStateFromError != 'function' ? null : u.render();
    return (
      (t.flags |= 1),
      e !== null && v ? ((t.child = Ui(t, e.child, null, p)), (t.child = Ui(t, null, C, p))) : Vt(e, t, C, p),
      (t.memoizedState = u.state),
      f && Hm(t, s, !0),
      t.child
    );
  }
  function zg(e) {
    var t = e.stateNode;
    t.pendingContext ? Bm(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Bm(e, t.context, !1),
      hu(e, t.containerInfo);
  }
  function qg(e, t, s, u, f) {
    return Bi(), su(f), (t.flags |= 256), Vt(e, t, s, u), t.child;
  }
  var ku = { dehydrated: null, treeContext: null, retryLane: 0 };
  function Au(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
  }
  function Bg(e, t, s) {
    var u = t.pendingProps,
      f = st.current,
      p = !1,
      v = (t.flags & 128) !== 0,
      C;
    if (
      ((C = v) || (C = e !== null && e.memoizedState === null ? !1 : (f & 2) !== 0),
      C ? ((p = !0), (t.flags &= -129)) : (e === null || e.memoizedState !== null) && (f |= 1),
      Qe(st, f & 1),
      e === null)
    )
      return (
        au(t),
        (e = t.memoizedState),
        e !== null && ((e = e.dehydrated), e !== null)
          ? ((t.mode & 1) === 0 ? (t.lanes = 1) : e.data === '$!' ? (t.lanes = 8) : (t.lanes = 1073741824), null)
          : ((v = u.children),
            (e = u.fallback),
            p
              ? ((u = t.mode),
                (p = t.child),
                (v = { mode: 'hidden', children: v }),
                (u & 1) === 0 && p !== null ? ((p.childLanes = 0), (p.pendingProps = v)) : (p = js(v, u, 0, null)),
                (e = vi(e, u, s, null)),
                (p.return = t),
                (e.return = t),
                (p.sibling = e),
                (t.child = p),
                (t.child.memoizedState = Au(s)),
                (t.memoizedState = ku),
                e)
              : Lu(t, v))
      );
    if (((f = e.memoizedState), f !== null && ((C = f.dehydrated), C !== null))) return ME(e, t, v, u, C, f, s);
    if (p) {
      (p = u.fallback), (v = t.mode), (f = e.child), (C = f.sibling);
      var R = { mode: 'hidden', children: u.children };
      return (
        (v & 1) === 0 && t.child !== f
          ? ((u = t.child), (u.childLanes = 0), (u.pendingProps = R), (t.deletions = null))
          : ((u = Hn(f, R)), (u.subtreeFlags = f.subtreeFlags & 14680064)),
        C !== null ? (p = Hn(C, p)) : ((p = vi(p, v, s, null)), (p.flags |= 2)),
        (p.return = t),
        (u.return = t),
        (u.sibling = p),
        (t.child = u),
        (u = p),
        (p = t.child),
        (v = e.child.memoizedState),
        (v = v === null ? Au(s) : { baseLanes: v.baseLanes | s, cachePool: null, transitions: v.transitions }),
        (p.memoizedState = v),
        (p.childLanes = e.childLanes & ~s),
        (t.memoizedState = ku),
        u
      );
    }
    return (
      (p = e.child),
      (e = p.sibling),
      (u = Hn(p, { mode: 'visible', children: u.children })),
      (t.mode & 1) === 0 && (u.lanes = s),
      (u.return = t),
      (u.sibling = null),
      e !== null && ((s = t.deletions), s === null ? ((t.deletions = [e]), (t.flags |= 16)) : s.push(e)),
      (t.child = u),
      (t.memoizedState = null),
      u
    );
  }
  function Lu(e, t) {
    return (t = js({ mode: 'visible', children: t }, e.mode, 0, null)), (t.return = e), (e.child = t);
  }
  function Es(e, t, s, u) {
    return (
      u !== null && su(u),
      Ui(t, e.child, null, s),
      (e = Lu(t, t.pendingProps.children)),
      (e.flags |= 2),
      (t.memoizedState = null),
      e
    );
  }
  function ME(e, t, s, u, f, p, v) {
    if (s)
      return t.flags & 256
        ? ((t.flags &= -257), (u = Tu(Error(n(422)))), Es(e, t, v, u))
        : t.memoizedState !== null
        ? ((t.child = e.child), (t.flags |= 128), null)
        : ((p = u.fallback),
          (f = t.mode),
          (u = js({ mode: 'visible', children: u.children }, f, 0, null)),
          (p = vi(p, f, v, null)),
          (p.flags |= 2),
          (u.return = t),
          (p.return = t),
          (u.sibling = p),
          (t.child = u),
          (t.mode & 1) !== 0 && Ui(t, e.child, null, v),
          (t.child.memoizedState = Au(v)),
          (t.memoizedState = ku),
          p);
    if ((t.mode & 1) === 0) return Es(e, t, v, null);
    if (f.data === '$!') {
      if (((u = f.nextSibling && f.nextSibling.dataset), u)) var C = u.dgst;
      return (u = C), (p = Error(n(419))), (u = Tu(p, u, void 0)), Es(e, t, v, u);
    }
    if (((C = (v & e.childLanes) !== 0), Jt || C)) {
      if (((u = Ot), u !== null)) {
        switch (v & -v) {
          case 4:
            f = 2;
            break;
          case 16:
            f = 8;
            break;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            f = 32;
            break;
          case 536870912:
            f = 268435456;
            break;
          default:
            f = 0;
        }
        (f = (f & (u.suspendedLanes | v)) !== 0 ? 0 : f),
          f !== 0 && f !== p.retryLane && ((p.retryLane = f), mn(e, f), Mr(u, e, f, -1));
      }
      return Yu(), (u = Tu(Error(n(421)))), Es(e, t, v, u);
    }
    return f.data === '$?'
      ? ((t.flags |= 128), (t.child = e.child), (t = YE.bind(null, e)), (f._reactRetry = t), null)
      : ((e = p.treeContext),
        (fr = An(f.nextSibling)),
        (dr = t),
        (rt = !0),
        (Ar = null),
        e !== null && ((wr[_r++] = pn), (wr[_r++] = hn), (wr[_r++] = ui), (pn = e.id), (hn = e.overflow), (ui = t)),
        (t = Lu(t, u.children)),
        (t.flags |= 4096),
        t);
  }
  function Ug(e, t, s) {
    e.lanes |= t;
    var u = e.alternate;
    u !== null && (u.lanes |= t), du(e.return, t, s);
  }
  function ju(e, t, s, u, f) {
    var p = e.memoizedState;
    p === null
      ? (e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: u, tail: s, tailMode: f })
      : ((p.isBackwards = t),
        (p.rendering = null),
        (p.renderingStartTime = 0),
        (p.last = u),
        (p.tail = s),
        (p.tailMode = f));
  }
  function Hg(e, t, s) {
    var u = t.pendingProps,
      f = u.revealOrder,
      p = u.tail;
    if ((Vt(e, t, u.children, s), (u = st.current), (u & 2) !== 0)) (u = (u & 1) | 2), (t.flags |= 128);
    else {
      if (e !== null && (e.flags & 128) !== 0)
        e: for (e = t.child; e !== null; ) {
          if (e.tag === 13) e.memoizedState !== null && Ug(e, s, t);
          else if (e.tag === 19) Ug(e, s, t);
          else if (e.child !== null) {
            (e.child.return = e), (e = e.child);
            continue;
          }
          if (e === t) break e;
          for (; e.sibling === null; ) {
            if (e.return === null || e.return === t) break e;
            e = e.return;
          }
          (e.sibling.return = e.return), (e = e.sibling);
        }
      u &= 1;
    }
    if ((Qe(st, u), (t.mode & 1) === 0)) t.memoizedState = null;
    else
      switch (f) {
        case 'forwards':
          for (s = t.child, f = null; s !== null; )
            (e = s.alternate), e !== null && ms(e) === null && (f = s), (s = s.sibling);
          (s = f),
            s === null ? ((f = t.child), (t.child = null)) : ((f = s.sibling), (s.sibling = null)),
            ju(t, !1, f, s, p);
          break;
        case 'backwards':
          for (s = null, f = t.child, t.child = null; f !== null; ) {
            if (((e = f.alternate), e !== null && ms(e) === null)) {
              t.child = f;
              break;
            }
            (e = f.sibling), (f.sibling = s), (s = f), (f = e);
          }
          ju(t, !0, s, null, p);
          break;
        case 'together':
          ju(t, !1, null, null, void 0);
          break;
        default:
          t.memoizedState = null;
      }
    return t.child;
  }
  function bs(e, t) {
    (t.mode & 1) === 0 && e !== null && ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
  }
  function yn(e, t, s) {
    if ((e !== null && (t.dependencies = e.dependencies), (hi |= t.lanes), (s & t.childLanes) === 0)) return null;
    if (e !== null && t.child !== e.child) throw Error(n(153));
    if (t.child !== null) {
      for (e = t.child, s = Hn(e, e.pendingProps), t.child = s, s.return = t; e.sibling !== null; )
        (e = e.sibling), (s = s.sibling = Hn(e, e.pendingProps)), (s.return = t);
      s.sibling = null;
    }
    return t.child;
  }
  function FE(e, t, s) {
    switch (t.tag) {
      case 3:
        zg(t), Bi();
        break;
      case 5:
        ig(t);
        break;
      case 1:
        Zt(t.type) && os(t);
        break;
      case 4:
        hu(t, t.stateNode.containerInfo);
        break;
      case 10:
        var u = t.type._context,
          f = t.memoizedProps.value;
        Qe(ds, u._currentValue), (u._currentValue = f);
        break;
      case 13:
        if (((u = t.memoizedState), u !== null))
          return u.dehydrated !== null
            ? (Qe(st, st.current & 1), (t.flags |= 128), null)
            : (s & t.child.childLanes) !== 0
            ? Bg(e, t, s)
            : (Qe(st, st.current & 1), (e = yn(e, t, s)), e !== null ? e.sibling : null);
        Qe(st, st.current & 1);
        break;
      case 19:
        if (((u = (s & t.childLanes) !== 0), (e.flags & 128) !== 0)) {
          if (u) return Hg(e, t, s);
          t.flags |= 128;
        }
        if (
          ((f = t.memoizedState),
          f !== null && ((f.rendering = null), (f.tail = null), (f.lastEffect = null)),
          Qe(st, st.current),
          u)
        )
          break;
        return null;
      case 22:
      case 23:
        return (t.lanes = 0), Mg(e, t, s);
    }
    return yn(e, t, s);
  }
  var Kg, Du, Vg, Wg;
  (Kg = function (e, t) {
    for (var s = t.child; s !== null; ) {
      if (s.tag === 5 || s.tag === 6) e.appendChild(s.stateNode);
      else if (s.tag !== 4 && s.child !== null) {
        (s.child.return = s), (s = s.child);
        continue;
      }
      if (s === t) break;
      for (; s.sibling === null; ) {
        if (s.return === null || s.return === t) return;
        s = s.return;
      }
      (s.sibling.return = s.return), (s = s.sibling);
    }
  }),
    (Du = function () {}),
    (Vg = function (e, t, s, u) {
      var f = e.memoizedProps;
      if (f !== u) {
        (e = t.stateNode), fi(Xr.current);
        var p = null;
        switch (s) {
          case 'input':
            (f = Ur(e, f)), (u = Ur(e, u)), (p = []);
            break;
          case 'select':
            (f = ee({}, f, { value: void 0 })), (u = ee({}, u, { value: void 0 })), (p = []);
            break;
          case 'textarea':
            (f = Et(e, f)), (u = Et(e, u)), (p = []);
            break;
          default:
            typeof f.onClick != 'function' && typeof u.onClick == 'function' && (e.onclick = rs);
        }
        Ir(s, u);
        var v;
        s = null;
        for (B in f)
          if (!u.hasOwnProperty(B) && f.hasOwnProperty(B) && f[B] != null)
            if (B === 'style') {
              var C = f[B];
              for (v in C) C.hasOwnProperty(v) && (s || (s = {}), (s[v] = ''));
            } else
              B !== 'dangerouslySetInnerHTML' &&
                B !== 'children' &&
                B !== 'suppressContentEditableWarning' &&
                B !== 'suppressHydrationWarning' &&
                B !== 'autoFocus' &&
                (a.hasOwnProperty(B) ? p || (p = []) : (p = p || []).push(B, null));
        for (B in u) {
          var R = u[B];
          if (((C = f?.[B]), u.hasOwnProperty(B) && R !== C && (R != null || C != null)))
            if (B === 'style')
              if (C) {
                for (v in C) !C.hasOwnProperty(v) || (R && R.hasOwnProperty(v)) || (s || (s = {}), (s[v] = ''));
                for (v in R) R.hasOwnProperty(v) && C[v] !== R[v] && (s || (s = {}), (s[v] = R[v]));
              } else s || (p || (p = []), p.push(B, s)), (s = R);
            else
              B === 'dangerouslySetInnerHTML'
                ? ((R = R ? R.__html : void 0),
                  (C = C ? C.__html : void 0),
                  R != null && C !== R && (p = p || []).push(B, R))
                : B === 'children'
                ? (typeof R != 'string' && typeof R != 'number') || (p = p || []).push(B, '' + R)
                : B !== 'suppressContentEditableWarning' &&
                  B !== 'suppressHydrationWarning' &&
                  (a.hasOwnProperty(B)
                    ? (R != null && B === 'onScroll' && Je('scroll', e), p || C === R || (p = []))
                    : (p = p || []).push(B, R));
        }
        s && (p = p || []).push('style', s);
        var B = p;
        (t.updateQueue = B) && (t.flags |= 4);
      }
    }),
    (Wg = function (e, t, s, u) {
      s !== u && (t.flags |= 4);
    });
  function Yo(e, t) {
    if (!rt)
      switch (e.tailMode) {
        case 'hidden':
          t = e.tail;
          for (var s = null; t !== null; ) t.alternate !== null && (s = t), (t = t.sibling);
          s === null ? (e.tail = null) : (s.sibling = null);
          break;
        case 'collapsed':
          s = e.tail;
          for (var u = null; s !== null; ) s.alternate !== null && (u = s), (s = s.sibling);
          u === null ? (t || e.tail === null ? (e.tail = null) : (e.tail.sibling = null)) : (u.sibling = null);
      }
  }
  function Mt(e) {
    var t = e.alternate !== null && e.alternate.child === e.child,
      s = 0,
      u = 0;
    if (t)
      for (var f = e.child; f !== null; )
        (s |= f.lanes | f.childLanes),
          (u |= f.subtreeFlags & 14680064),
          (u |= f.flags & 14680064),
          (f.return = e),
          (f = f.sibling);
    else
      for (f = e.child; f !== null; )
        (s |= f.lanes | f.childLanes), (u |= f.subtreeFlags), (u |= f.flags), (f.return = e), (f = f.sibling);
    return (e.subtreeFlags |= u), (e.childLanes = s), t;
  }
  function $E(e, t, s) {
    var u = t.pendingProps;
    switch ((iu(t), t.tag)) {
      case 2:
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Mt(t), null;
      case 1:
        return Zt(t.type) && is(), Mt(t), null;
      case 3:
        return (
          (u = t.stateNode),
          Vi(),
          et(Qt),
          et(jt),
          yu(),
          u.pendingContext && ((u.context = u.pendingContext), (u.pendingContext = null)),
          (e === null || e.child === null) &&
            (us(t)
              ? (t.flags |= 4)
              : e === null ||
                (e.memoizedState.isDehydrated && (t.flags & 256) === 0) ||
                ((t.flags |= 1024), Ar !== null && (Wu(Ar), (Ar = null)))),
          Du(e, t),
          Mt(t),
          null
        );
      case 5:
        mu(t);
        var f = fi(Ko.current);
        if (((s = t.type), e !== null && t.stateNode != null))
          Vg(e, t, s, u, f), e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152));
        else {
          if (!u) {
            if (t.stateNode === null) throw Error(n(166));
            return Mt(t), null;
          }
          if (((e = fi(Xr.current)), us(t))) {
            (u = t.stateNode), (s = t.type);
            var p = t.memoizedProps;
            switch (((u[Gr] = t), (u[zo] = p), (e = (t.mode & 1) !== 0), s)) {
              case 'dialog':
                Je('cancel', u), Je('close', u);
                break;
              case 'iframe':
              case 'object':
              case 'embed':
                Je('load', u);
                break;
              case 'video':
              case 'audio':
                for (f = 0; f < Mo.length; f++) Je(Mo[f], u);
                break;
              case 'source':
                Je('error', u);
                break;
              case 'img':
              case 'image':
              case 'link':
                Je('error', u), Je('load', u);
                break;
              case 'details':
                Je('toggle', u);
                break;
              case 'input':
                qe(u, p), Je('invalid', u);
                break;
              case 'select':
                (u._wrapperState = { wasMultiple: !!p.multiple }), Je('invalid', u);
                break;
              case 'textarea':
                ot(u, p), Je('invalid', u);
            }
            Ir(s, p), (f = null);
            for (var v in p)
              if (p.hasOwnProperty(v)) {
                var C = p[v];
                v === 'children'
                  ? typeof C == 'string'
                    ? u.textContent !== C &&
                      (p.suppressHydrationWarning !== !0 && ts(u.textContent, C, e), (f = ['children', C]))
                    : typeof C == 'number' &&
                      u.textContent !== '' + C &&
                      (p.suppressHydrationWarning !== !0 && ts(u.textContent, C, e), (f = ['children', '' + C]))
                  : a.hasOwnProperty(v) && C != null && v === 'onScroll' && Je('scroll', u);
              }
            switch (s) {
              case 'input':
                Xt(u), or(u, p, !0);
                break;
              case 'textarea':
                Xt(u), Rt(u);
                break;
              case 'select':
              case 'option':
                break;
              default:
                typeof p.onClick == 'function' && (u.onclick = rs);
            }
            (u = f), (t.updateQueue = u), u !== null && (t.flags |= 4);
          } else {
            (v = f.nodeType === 9 ? f : f.ownerDocument),
              e === 'http://www.w3.org/1999/xhtml' && (e = Hr(s)),
              e === 'http://www.w3.org/1999/xhtml'
                ? s === 'script'
                  ? ((e = v.createElement('div')),
                    (e.innerHTML = '<script></script>'),
                    (e = e.removeChild(e.firstChild)))
                  : typeof u.is == 'string'
                  ? (e = v.createElement(s, { is: u.is }))
                  : ((e = v.createElement(s)),
                    s === 'select' && ((v = e), u.multiple ? (v.multiple = !0) : u.size && (v.size = u.size)))
                : (e = v.createElementNS(e, s)),
              (e[Gr] = t),
              (e[zo] = u),
              Kg(e, t, !1, !1),
              (t.stateNode = e);
            e: {
              switch (((v = Nr(s, u)), s)) {
                case 'dialog':
                  Je('cancel', e), Je('close', e), (f = u);
                  break;
                case 'iframe':
                case 'object':
                case 'embed':
                  Je('load', e), (f = u);
                  break;
                case 'video':
                case 'audio':
                  for (f = 0; f < Mo.length; f++) Je(Mo[f], e);
                  f = u;
                  break;
                case 'source':
                  Je('error', e), (f = u);
                  break;
                case 'img':
                case 'image':
                case 'link':
                  Je('error', e), Je('load', e), (f = u);
                  break;
                case 'details':
                  Je('toggle', e), (f = u);
                  break;
                case 'input':
                  qe(e, u), (f = Ur(e, u)), Je('invalid', e);
                  break;
                case 'option':
                  f = u;
                  break;
                case 'select':
                  (e._wrapperState = { wasMultiple: !!u.multiple }),
                    (f = ee({}, u, { value: void 0 })),
                    Je('invalid', e);
                  break;
                case 'textarea':
                  ot(e, u), (f = Et(e, u)), Je('invalid', e);
                  break;
                default:
                  f = u;
              }
              Ir(s, f), (C = f);
              for (p in C)
                if (C.hasOwnProperty(p)) {
                  var R = C[p];
                  p === 'style'
                    ? at(e, R)
                    : p === 'dangerouslySetInnerHTML'
                    ? ((R = R ? R.__html : void 0), R != null && mt(e, R))
                    : p === 'children'
                    ? typeof R == 'string'
                      ? (s !== 'textarea' || R !== '') && Ht(e, R)
                      : typeof R == 'number' && Ht(e, '' + R)
                    : p !== 'suppressContentEditableWarning' &&
                      p !== 'suppressHydrationWarning' &&
                      p !== 'autoFocus' &&
                      (a.hasOwnProperty(p)
                        ? R != null && p === 'onScroll' && Je('scroll', e)
                        : R != null && $(e, p, R, v));
                }
              switch (s) {
                case 'input':
                  Xt(e), or(e, u, !1);
                  break;
                case 'textarea':
                  Xt(e), Rt(e);
                  break;
                case 'option':
                  u.value != null && e.setAttribute('value', '' + Re(u.value));
                  break;
                case 'select':
                  (e.multiple = !!u.multiple),
                    (p = u.value),
                    p != null
                      ? ct(e, !!u.multiple, p, !1)
                      : u.defaultValue != null && ct(e, !!u.multiple, u.defaultValue, !0);
                  break;
                default:
                  typeof f.onClick == 'function' && (e.onclick = rs);
              }
              switch (s) {
                case 'button':
                case 'input':
                case 'select':
                case 'textarea':
                  u = !!u.autoFocus;
                  break e;
                case 'img':
                  u = !0;
                  break e;
                default:
                  u = !1;
              }
            }
            u && (t.flags |= 4);
          }
          t.ref !== null && ((t.flags |= 512), (t.flags |= 2097152));
        }
        return Mt(t), null;
      case 6:
        if (e && t.stateNode != null) Wg(e, t, e.memoizedProps, u);
        else {
          if (typeof u != 'string' && t.stateNode === null) throw Error(n(166));
          if (((s = fi(Ko.current)), fi(Xr.current), us(t))) {
            if (
              ((u = t.stateNode), (s = t.memoizedProps), (u[Gr] = t), (p = u.nodeValue !== s) && ((e = dr), e !== null))
            )
              switch (e.tag) {
                case 3:
                  ts(u.nodeValue, s, (e.mode & 1) !== 0);
                  break;
                case 5:
                  e.memoizedProps.suppressHydrationWarning !== !0 && ts(u.nodeValue, s, (e.mode & 1) !== 0);
              }
            p && (t.flags |= 4);
          } else (u = (s.nodeType === 9 ? s : s.ownerDocument).createTextNode(u)), (u[Gr] = t), (t.stateNode = u);
        }
        return Mt(t), null;
      case 13:
        if (
          (et(st),
          (u = t.memoizedState),
          e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
        ) {
          if (rt && fr !== null && (t.mode & 1) !== 0 && (t.flags & 128) === 0)
            Ym(), Bi(), (t.flags |= 98560), (p = !1);
          else if (((p = us(t)), u !== null && u.dehydrated !== null)) {
            if (e === null) {
              if (!p) throw Error(n(318));
              if (((p = t.memoizedState), (p = p !== null ? p.dehydrated : null), !p)) throw Error(n(317));
              p[Gr] = t;
            } else Bi(), (t.flags & 128) === 0 && (t.memoizedState = null), (t.flags |= 4);
            Mt(t), (p = !1);
          } else Ar !== null && (Wu(Ar), (Ar = null)), (p = !0);
          if (!p) return t.flags & 65536 ? t : null;
        }
        return (t.flags & 128) !== 0
          ? ((t.lanes = s), t)
          : ((u = u !== null),
            u !== (e !== null && e.memoizedState !== null) &&
              u &&
              ((t.child.flags |= 8192),
              (t.mode & 1) !== 0 && (e === null || (st.current & 1) !== 0 ? _t === 0 && (_t = 3) : Yu())),
            t.updateQueue !== null && (t.flags |= 4),
            Mt(t),
            null);
      case 4:
        return Vi(), Du(e, t), e === null && Fo(t.stateNode.containerInfo), Mt(t), null;
      case 10:
        return cu(t.type._context), Mt(t), null;
      case 17:
        return Zt(t.type) && is(), Mt(t), null;
      case 19:
        if ((et(st), (p = t.memoizedState), p === null)) return Mt(t), null;
        if (((u = (t.flags & 128) !== 0), (v = p.rendering), v === null))
          if (u) Yo(p, !1);
          else {
            if (_t !== 0 || (e !== null && (e.flags & 128) !== 0))
              for (e = t.child; e !== null; ) {
                if (((v = ms(e)), v !== null)) {
                  for (
                    t.flags |= 128,
                      Yo(p, !1),
                      u = v.updateQueue,
                      u !== null && ((t.updateQueue = u), (t.flags |= 4)),
                      t.subtreeFlags = 0,
                      u = s,
                      s = t.child;
                    s !== null;

                  )
                    (p = s),
                      (e = u),
                      (p.flags &= 14680066),
                      (v = p.alternate),
                      v === null
                        ? ((p.childLanes = 0),
                          (p.lanes = e),
                          (p.child = null),
                          (p.subtreeFlags = 0),
                          (p.memoizedProps = null),
                          (p.memoizedState = null),
                          (p.updateQueue = null),
                          (p.dependencies = null),
                          (p.stateNode = null))
                        : ((p.childLanes = v.childLanes),
                          (p.lanes = v.lanes),
                          (p.child = v.child),
                          (p.subtreeFlags = 0),
                          (p.deletions = null),
                          (p.memoizedProps = v.memoizedProps),
                          (p.memoizedState = v.memoizedState),
                          (p.updateQueue = v.updateQueue),
                          (p.type = v.type),
                          (e = v.dependencies),
                          (p.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext })),
                      (s = s.sibling);
                  return Qe(st, (st.current & 1) | 2), t.child;
                }
                e = e.sibling;
              }
            p.tail !== null && Ve() > Yi && ((t.flags |= 128), (u = !0), Yo(p, !1), (t.lanes = 4194304));
          }
        else {
          if (!u)
            if (((e = ms(v)), e !== null)) {
              if (
                ((t.flags |= 128),
                (u = !0),
                (s = e.updateQueue),
                s !== null && ((t.updateQueue = s), (t.flags |= 4)),
                Yo(p, !0),
                p.tail === null && p.tailMode === 'hidden' && !v.alternate && !rt)
              )
                return Mt(t), null;
            } else
              2 * Ve() - p.renderingStartTime > Yi &&
                s !== 1073741824 &&
                ((t.flags |= 128), (u = !0), Yo(p, !1), (t.lanes = 4194304));
          p.isBackwards
            ? ((v.sibling = t.child), (t.child = v))
            : ((s = p.last), s !== null ? (s.sibling = v) : (t.child = v), (p.last = v));
        }
        return p.tail !== null
          ? ((t = p.tail),
            (p.rendering = t),
            (p.tail = t.sibling),
            (p.renderingStartTime = Ve()),
            (t.sibling = null),
            (s = st.current),
            Qe(st, u ? (s & 1) | 2 : s & 1),
            t)
          : (Mt(t), null);
      case 22:
      case 23:
        return (
          Xu(),
          (u = t.memoizedState !== null),
          e !== null && (e.memoizedState !== null) !== u && (t.flags |= 8192),
          u && (t.mode & 1) !== 0 ? (pr & 1073741824) !== 0 && (Mt(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Mt(t),
          null
        );
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(n(156, t.tag));
  }
  function zE(e, t) {
    switch ((iu(t), t.tag)) {
      case 1:
        return Zt(t.type) && is(), (e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null;
      case 3:
        return (
          Vi(),
          et(Qt),
          et(jt),
          yu(),
          (e = t.flags),
          (e & 65536) !== 0 && (e & 128) === 0 ? ((t.flags = (e & -65537) | 128), t) : null
        );
      case 5:
        return mu(t), null;
      case 13:
        if ((et(st), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
          if (t.alternate === null) throw Error(n(340));
          Bi();
        }
        return (e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null;
      case 19:
        return et(st), null;
      case 4:
        return Vi(), null;
      case 10:
        return cu(t.type._context), null;
      case 22:
      case 23:
        return Xu(), null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var Cs = !1,
    Ft = !1,
    qE = typeof WeakSet == 'function' ? WeakSet : Set,
    ce = null;
  function Gi(e, t) {
    var s = e.ref;
    if (s !== null)
      if (typeof s == 'function')
        try {
          s(null);
        } catch (u) {
          dt(e, t, u);
        }
      else s.current = null;
  }
  function Mu(e, t, s) {
    try {
      s();
    } catch (u) {
      dt(e, t, u);
    }
  }
  var Gg = !1;
  function BE(e, t) {
    if (((Xl = Ha), (e = xm()), ql(e))) {
      if ('selectionStart' in e) var s = { start: e.selectionStart, end: e.selectionEnd };
      else
        e: {
          s = ((s = e.ownerDocument) && s.defaultView) || window;
          var u = s.getSelection && s.getSelection();
          if (u && u.rangeCount !== 0) {
            s = u.anchorNode;
            var f = u.anchorOffset,
              p = u.focusNode;
            u = u.focusOffset;
            try {
              s.nodeType, p.nodeType;
            } catch {
              s = null;
              break e;
            }
            var v = 0,
              C = -1,
              R = -1,
              B = 0,
              Q = 0,
              J = e,
              Y = null;
            t: for (;;) {
              for (
                var ae;
                J !== s || (f !== 0 && J.nodeType !== 3) || (C = v + f),
                  J !== p || (u !== 0 && J.nodeType !== 3) || (R = v + u),
                  J.nodeType === 3 && (v += J.nodeValue.length),
                  (ae = J.firstChild) !== null;

              )
                (Y = J), (J = ae);
              for (;;) {
                if (J === e) break t;
                if ((Y === s && ++B === f && (C = v), Y === p && ++Q === u && (R = v), (ae = J.nextSibling) !== null))
                  break;
                (J = Y), (Y = J.parentNode);
              }
              J = ae;
            }
            s = C === -1 || R === -1 ? null : { start: C, end: R };
          } else s = null;
        }
      s = s || { start: 0, end: 0 };
    } else s = null;
    for (Yl = { focusedElem: e, selectionRange: s }, Ha = !1, ce = t; ce !== null; )
      if (((t = ce), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null)) (e.return = t), (ce = e);
      else
        for (; ce !== null; ) {
          t = ce;
          try {
            var he = t.alternate;
            if ((t.flags & 1024) !== 0)
              switch (t.tag) {
                case 0:
                case 11:
                case 15:
                  break;
                case 1:
                  if (he !== null) {
                    var ge = he.memoizedProps,
                      pt = he.memoizedState,
                      D = t.stateNode,
                      N = D.getSnapshotBeforeUpdate(t.elementType === t.type ? ge : Lr(t.type, ge), pt);
                    D.__reactInternalSnapshotBeforeUpdate = N;
                  }
                  break;
                case 3:
                  var M = t.stateNode.containerInfo;
                  M.nodeType === 1
                    ? (M.textContent = '')
                    : M.nodeType === 9 && M.documentElement && M.removeChild(M.documentElement);
                  break;
                case 5:
                case 6:
                case 4:
                case 17:
                  break;
                default:
                  throw Error(n(163));
              }
          } catch (re) {
            dt(t, t.return, re);
          }
          if (((e = t.sibling), e !== null)) {
            (e.return = t.return), (ce = e);
            break;
          }
          ce = t.return;
        }
    return (he = Gg), (Gg = !1), he;
  }
  function Qo(e, t, s) {
    var u = t.updateQueue;
    if (((u = u !== null ? u.lastEffect : null), u !== null)) {
      var f = (u = u.next);
      do {
        if ((f.tag & e) === e) {
          var p = f.destroy;
          (f.destroy = void 0), p !== void 0 && Mu(t, s, p);
        }
        f = f.next;
      } while (f !== u);
    }
  }
  function Os(e, t) {
    if (((t = t.updateQueue), (t = t !== null ? t.lastEffect : null), t !== null)) {
      var s = (t = t.next);
      do {
        if ((s.tag & e) === e) {
          var u = s.create;
          s.destroy = u();
        }
        s = s.next;
      } while (s !== t);
    }
  }
  function Fu(e) {
    var t = e.ref;
    if (t !== null) {
      var s = e.stateNode;
      e.tag, (e = s), typeof t == 'function' ? t(e) : (t.current = e);
    }
  }
  function Xg(e) {
    var t = e.alternate;
    t !== null && ((e.alternate = null), Xg(t)),
      (e.child = null),
      (e.deletions = null),
      (e.sibling = null),
      e.tag === 5 &&
        ((t = e.stateNode), t !== null && (delete t[Gr], delete t[zo], delete t[eu], delete t[CE], delete t[OE])),
      (e.stateNode = null),
      (e.return = null),
      (e.dependencies = null),
      (e.memoizedProps = null),
      (e.memoizedState = null),
      (e.pendingProps = null),
      (e.stateNode = null),
      (e.updateQueue = null);
  }
  function Yg(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
  }
  function Qg(e) {
    e: for (;;) {
      for (; e.sibling === null; ) {
        if (e.return === null || Yg(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
        (e.child.return = e), (e = e.child);
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function $u(e, t, s) {
    var u = e.tag;
    if (u === 5 || u === 6)
      (e = e.stateNode),
        t
          ? s.nodeType === 8
            ? s.parentNode.insertBefore(e, t)
            : s.insertBefore(e, t)
          : (s.nodeType === 8 ? ((t = s.parentNode), t.insertBefore(e, s)) : ((t = s), t.appendChild(e)),
            (s = s._reactRootContainer),
            s != null || t.onclick !== null || (t.onclick = rs));
    else if (u !== 4 && ((e = e.child), e !== null))
      for ($u(e, t, s), e = e.sibling; e !== null; ) $u(e, t, s), (e = e.sibling);
  }
  function zu(e, t, s) {
    var u = e.tag;
    if (u === 5 || u === 6) (e = e.stateNode), t ? s.insertBefore(e, t) : s.appendChild(e);
    else if (u !== 4 && ((e = e.child), e !== null))
      for (zu(e, t, s), e = e.sibling; e !== null; ) zu(e, t, s), (e = e.sibling);
  }
  var kt = null,
    jr = !1;
  function $n(e, t, s) {
    for (s = s.child; s !== null; ) Zg(e, t, s), (s = s.sibling);
  }
  function Zg(e, t, s) {
    if (Kt && typeof Kt.onCommitFiberUnmount == 'function')
      try {
        Kt.onCommitFiberUnmount(ln, s);
      } catch {}
    switch (s.tag) {
      case 5:
        Ft || Gi(s, t);
      case 6:
        var u = kt,
          f = jr;
        (kt = null),
          $n(e, t, s),
          (kt = u),
          (jr = f),
          kt !== null &&
            (jr
              ? ((e = kt), (s = s.stateNode), e.nodeType === 8 ? e.parentNode.removeChild(s) : e.removeChild(s))
              : kt.removeChild(s.stateNode));
        break;
      case 18:
        kt !== null &&
          (jr
            ? ((e = kt),
              (s = s.stateNode),
              e.nodeType === 8 ? Jl(e.parentNode, s) : e.nodeType === 1 && Jl(e, s),
              Ro(e))
            : Jl(kt, s.stateNode));
        break;
      case 4:
        (u = kt), (f = jr), (kt = s.stateNode.containerInfo), (jr = !0), $n(e, t, s), (kt = u), (jr = f);
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        if (!Ft && ((u = s.updateQueue), u !== null && ((u = u.lastEffect), u !== null))) {
          f = u = u.next;
          do {
            var p = f,
              v = p.destroy;
            (p = p.tag), v !== void 0 && ((p & 2) !== 0 || (p & 4) !== 0) && Mu(s, t, v), (f = f.next);
          } while (f !== u);
        }
        $n(e, t, s);
        break;
      case 1:
        if (!Ft && (Gi(s, t), (u = s.stateNode), typeof u.componentWillUnmount == 'function'))
          try {
            (u.props = s.memoizedProps), (u.state = s.memoizedState), u.componentWillUnmount();
          } catch (C) {
            dt(s, t, C);
          }
        $n(e, t, s);
        break;
      case 21:
        $n(e, t, s);
        break;
      case 22:
        s.mode & 1 ? ((Ft = (u = Ft) || s.memoizedState !== null), $n(e, t, s), (Ft = u)) : $n(e, t, s);
        break;
      default:
        $n(e, t, s);
    }
  }
  function Jg(e) {
    var t = e.updateQueue;
    if (t !== null) {
      e.updateQueue = null;
      var s = e.stateNode;
      s === null && (s = e.stateNode = new qE()),
        t.forEach(function (u) {
          var f = QE.bind(null, e, u);
          s.has(u) || (s.add(u), u.then(f, f));
        });
    }
  }
  function Dr(e, t) {
    var s = t.deletions;
    if (s !== null)
      for (var u = 0; u < s.length; u++) {
        var f = s[u];
        try {
          var p = e,
            v = t,
            C = v;
          e: for (; C !== null; ) {
            switch (C.tag) {
              case 5:
                (kt = C.stateNode), (jr = !1);
                break e;
              case 3:
                (kt = C.stateNode.containerInfo), (jr = !0);
                break e;
              case 4:
                (kt = C.stateNode.containerInfo), (jr = !0);
                break e;
            }
            C = C.return;
          }
          if (kt === null) throw Error(n(160));
          Zg(p, v, f), (kt = null), (jr = !1);
          var R = f.alternate;
          R !== null && (R.return = null), (f.return = null);
        } catch (B) {
          dt(f, t, B);
        }
      }
    if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) ey(t, e), (t = t.sibling);
  }
  function ey(e, t) {
    var s = e.alternate,
      u = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        if ((Dr(t, e), Qr(e), u & 4)) {
          try {
            Qo(3, e, e.return), Os(3, e);
          } catch (ge) {
            dt(e, e.return, ge);
          }
          try {
            Qo(5, e, e.return);
          } catch (ge) {
            dt(e, e.return, ge);
          }
        }
        break;
      case 1:
        Dr(t, e), Qr(e), u & 512 && s !== null && Gi(s, s.return);
        break;
      case 5:
        if ((Dr(t, e), Qr(e), u & 512 && s !== null && Gi(s, s.return), e.flags & 32)) {
          var f = e.stateNode;
          try {
            Ht(f, '');
          } catch (ge) {
            dt(e, e.return, ge);
          }
        }
        if (u & 4 && ((f = e.stateNode), f != null)) {
          var p = e.memoizedProps,
            v = s !== null ? s.memoizedProps : p,
            C = e.type,
            R = e.updateQueue;
          if (((e.updateQueue = null), R !== null))
            try {
              C === 'input' && p.type === 'radio' && p.name != null && Tt(f, p), Nr(C, v);
              var B = Nr(C, p);
              for (v = 0; v < R.length; v += 2) {
                var Q = R[v],
                  J = R[v + 1];
                Q === 'style'
                  ? at(f, J)
                  : Q === 'dangerouslySetInnerHTML'
                  ? mt(f, J)
                  : Q === 'children'
                  ? Ht(f, J)
                  : $(f, Q, J, B);
              }
              switch (C) {
                case 'input':
                  je(f, p);
                  break;
                case 'textarea':
                  vt(f, p);
                  break;
                case 'select':
                  var Y = f._wrapperState.wasMultiple;
                  f._wrapperState.wasMultiple = !!p.multiple;
                  var ae = p.value;
                  ae != null
                    ? ct(f, !!p.multiple, ae, !1)
                    : Y !== !!p.multiple &&
                      (p.defaultValue != null
                        ? ct(f, !!p.multiple, p.defaultValue, !0)
                        : ct(f, !!p.multiple, p.multiple ? [] : '', !1));
              }
              f[zo] = p;
            } catch (ge) {
              dt(e, e.return, ge);
            }
        }
        break;
      case 6:
        if ((Dr(t, e), Qr(e), u & 4)) {
          if (e.stateNode === null) throw Error(n(162));
          (f = e.stateNode), (p = e.memoizedProps);
          try {
            f.nodeValue = p;
          } catch (ge) {
            dt(e, e.return, ge);
          }
        }
        break;
      case 3:
        if ((Dr(t, e), Qr(e), u & 4 && s !== null && s.memoizedState.isDehydrated))
          try {
            Ro(t.containerInfo);
          } catch (ge) {
            dt(e, e.return, ge);
          }
        break;
      case 4:
        Dr(t, e), Qr(e);
        break;
      case 13:
        Dr(t, e),
          Qr(e),
          (f = e.child),
          f.flags & 8192 &&
            ((p = f.memoizedState !== null),
            (f.stateNode.isHidden = p),
            !p || (f.alternate !== null && f.alternate.memoizedState !== null) || (Uu = Ve())),
          u & 4 && Jg(e);
        break;
      case 22:
        if (
          ((Q = s !== null && s.memoizedState !== null),
          e.mode & 1 ? ((Ft = (B = Ft) || Q), Dr(t, e), (Ft = B)) : Dr(t, e),
          Qr(e),
          u & 8192)
        ) {
          if (((B = e.memoizedState !== null), (e.stateNode.isHidden = B) && !Q && (e.mode & 1) !== 0))
            for (ce = e, Q = e.child; Q !== null; ) {
              for (J = ce = Q; ce !== null; ) {
                switch (((Y = ce), (ae = Y.child), Y.tag)) {
                  case 0:
                  case 11:
                  case 14:
                  case 15:
                    Qo(4, Y, Y.return);
                    break;
                  case 1:
                    Gi(Y, Y.return);
                    var he = Y.stateNode;
                    if (typeof he.componentWillUnmount == 'function') {
                      (u = Y), (s = Y.return);
                      try {
                        (t = u), (he.props = t.memoizedProps), (he.state = t.memoizedState), he.componentWillUnmount();
                      } catch (ge) {
                        dt(u, s, ge);
                      }
                    }
                    break;
                  case 5:
                    Gi(Y, Y.return);
                    break;
                  case 22:
                    if (Y.memoizedState !== null) {
                      ny(J);
                      continue;
                    }
                }
                ae !== null ? ((ae.return = Y), (ce = ae)) : ny(J);
              }
              Q = Q.sibling;
            }
          e: for (Q = null, J = e; ; ) {
            if (J.tag === 5) {
              if (Q === null) {
                Q = J;
                try {
                  (f = J.stateNode),
                    B
                      ? ((p = f.style),
                        typeof p.setProperty == 'function'
                          ? p.setProperty('display', 'none', 'important')
                          : (p.display = 'none'))
                      : ((C = J.stateNode),
                        (R = J.memoizedProps.style),
                        (v = R != null && R.hasOwnProperty('display') ? R.display : null),
                        (C.style.display = It('display', v)));
                } catch (ge) {
                  dt(e, e.return, ge);
                }
              }
            } else if (J.tag === 6) {
              if (Q === null)
                try {
                  J.stateNode.nodeValue = B ? '' : J.memoizedProps;
                } catch (ge) {
                  dt(e, e.return, ge);
                }
            } else if (((J.tag !== 22 && J.tag !== 23) || J.memoizedState === null || J === e) && J.child !== null) {
              (J.child.return = J), (J = J.child);
              continue;
            }
            if (J === e) break e;
            for (; J.sibling === null; ) {
              if (J.return === null || J.return === e) break e;
              Q === J && (Q = null), (J = J.return);
            }
            Q === J && (Q = null), (J.sibling.return = J.return), (J = J.sibling);
          }
        }
        break;
      case 19:
        Dr(t, e), Qr(e), u & 4 && Jg(e);
        break;
      case 21:
        break;
      default:
        Dr(t, e), Qr(e);
    }
  }
  function Qr(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        e: {
          for (var s = e.return; s !== null; ) {
            if (Yg(s)) {
              var u = s;
              break e;
            }
            s = s.return;
          }
          throw Error(n(160));
        }
        switch (u.tag) {
          case 5:
            var f = u.stateNode;
            u.flags & 32 && (Ht(f, ''), (u.flags &= -33));
            var p = Qg(e);
            zu(e, p, f);
            break;
          case 3:
          case 4:
            var v = u.stateNode.containerInfo,
              C = Qg(e);
            $u(e, C, v);
            break;
          default:
            throw Error(n(161));
        }
      } catch (R) {
        dt(e, e.return, R);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function UE(e, t, s) {
    (ce = e), ty(e);
  }
  function ty(e, t, s) {
    for (var u = (e.mode & 1) !== 0; ce !== null; ) {
      var f = ce,
        p = f.child;
      if (f.tag === 22 && u) {
        var v = f.memoizedState !== null || Cs;
        if (!v) {
          var C = f.alternate,
            R = (C !== null && C.memoizedState !== null) || Ft;
          C = Cs;
          var B = Ft;
          if (((Cs = v), (Ft = R) && !B))
            for (ce = f; ce !== null; )
              (v = ce),
                (R = v.child),
                v.tag === 22 && v.memoizedState !== null ? iy(f) : R !== null ? ((R.return = v), (ce = R)) : iy(f);
          for (; p !== null; ) (ce = p), ty(p), (p = p.sibling);
          (ce = f), (Cs = C), (Ft = B);
        }
        ry(e);
      } else (f.subtreeFlags & 8772) !== 0 && p !== null ? ((p.return = f), (ce = p)) : ry(e);
    }
  }
  function ry(e) {
    for (; ce !== null; ) {
      var t = ce;
      if ((t.flags & 8772) !== 0) {
        var s = t.alternate;
        try {
          if ((t.flags & 8772) !== 0)
            switch (t.tag) {
              case 0:
              case 11:
              case 15:
                Ft || Os(5, t);
                break;
              case 1:
                var u = t.stateNode;
                if (t.flags & 4 && !Ft)
                  if (s === null) u.componentDidMount();
                  else {
                    var f = t.elementType === t.type ? s.memoizedProps : Lr(t.type, s.memoizedProps);
                    u.componentDidUpdate(f, s.memoizedState, u.__reactInternalSnapshotBeforeUpdate);
                  }
                var p = t.updateQueue;
                p !== null && ng(t, p, u);
                break;
              case 3:
                var v = t.updateQueue;
                if (v !== null) {
                  if (((s = null), t.child !== null))
                    switch (t.child.tag) {
                      case 5:
                        s = t.child.stateNode;
                        break;
                      case 1:
                        s = t.child.stateNode;
                    }
                  ng(t, v, s);
                }
                break;
              case 5:
                var C = t.stateNode;
                if (s === null && t.flags & 4) {
                  s = C;
                  var R = t.memoizedProps;
                  switch (t.type) {
                    case 'button':
                    case 'input':
                    case 'select':
                    case 'textarea':
                      R.autoFocus && s.focus();
                      break;
                    case 'img':
                      R.src && (s.src = R.src);
                  }
                }
                break;
              case 6:
                break;
              case 4:
                break;
              case 12:
                break;
              case 13:
                if (t.memoizedState === null) {
                  var B = t.alternate;
                  if (B !== null) {
                    var Q = B.memoizedState;
                    if (Q !== null) {
                      var J = Q.dehydrated;
                      J !== null && Ro(J);
                    }
                  }
                }
                break;
              case 19:
              case 17:
              case 21:
              case 22:
              case 23:
              case 25:
                break;
              default:
                throw Error(n(163));
            }
          Ft || (t.flags & 512 && Fu(t));
        } catch (Y) {
          dt(t, t.return, Y);
        }
      }
      if (t === e) {
        ce = null;
        break;
      }
      if (((s = t.sibling), s !== null)) {
        (s.return = t.return), (ce = s);
        break;
      }
      ce = t.return;
    }
  }
  function ny(e) {
    for (; ce !== null; ) {
      var t = ce;
      if (t === e) {
        ce = null;
        break;
      }
      var s = t.sibling;
      if (s !== null) {
        (s.return = t.return), (ce = s);
        break;
      }
      ce = t.return;
    }
  }
  function iy(e) {
    for (; ce !== null; ) {
      var t = ce;
      try {
        switch (t.tag) {
          case 0:
          case 11:
          case 15:
            var s = t.return;
            try {
              Os(4, t);
            } catch (R) {
              dt(t, s, R);
            }
            break;
          case 1:
            var u = t.stateNode;
            if (typeof u.componentDidMount == 'function') {
              var f = t.return;
              try {
                u.componentDidMount();
              } catch (R) {
                dt(t, f, R);
              }
            }
            var p = t.return;
            try {
              Fu(t);
            } catch (R) {
              dt(t, p, R);
            }
            break;
          case 5:
            var v = t.return;
            try {
              Fu(t);
            } catch (R) {
              dt(t, v, R);
            }
        }
      } catch (R) {
        dt(t, t.return, R);
      }
      if (t === e) {
        ce = null;
        break;
      }
      var C = t.sibling;
      if (C !== null) {
        (C.return = t.return), (ce = C);
        break;
      }
      ce = t.return;
    }
  }
  var HE = Math.ceil,
    xs = H.ReactCurrentDispatcher,
    qu = H.ReactCurrentOwner,
    br = H.ReactCurrentBatchConfig,
    Be = 0,
    Ot = null,
    yt = null,
    At = 0,
    pr = 0,
    Xi = Ln(0),
    _t = 0,
    Zo = null,
    hi = 0,
    Ps = 0,
    Bu = 0,
    Jo = null,
    er = null,
    Uu = 0,
    Yi = 1 / 0,
    vn = null,
    Ts = !1,
    Hu = null,
    zn = null,
    Rs = !1,
    qn = null,
    Is = 0,
    ea = 0,
    Ku = null,
    Ns = -1,
    ks = 0;
  function Wt() {
    return (Be & 6) !== 0 ? Ve() : Ns !== -1 ? Ns : (Ns = Ve());
  }
  function Bn(e) {
    return (e.mode & 1) === 0
      ? 1
      : (Be & 2) !== 0 && At !== 0
      ? At & -At
      : PE.transition !== null
      ? (ks === 0 && (ks = Qh()), ks)
      : ((e = We), e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : am(e.type))), e);
  }
  function Mr(e, t, s, u) {
    if (50 < ea) throw ((ea = 0), (Ku = null), Error(n(185)));
    Co(e, s, u),
      ((Be & 2) === 0 || e !== Ot) &&
        (e === Ot && ((Be & 2) === 0 && (Ps |= s), _t === 4 && Un(e, At)),
        tr(e, u),
        s === 1 && Be === 0 && (t.mode & 1) === 0 && ((Yi = Ve() + 500), as && Dn()));
  }
  function tr(e, t) {
    var s = e.callbackNode;
    P1(e, t);
    var u = qa(e, e === Ot ? At : 0);
    if (u === 0) s !== null && bt(s), (e.callbackNode = null), (e.callbackPriority = 0);
    else if (((t = u & -u), e.callbackPriority !== t)) {
      if ((s != null && bt(s), t === 1))
        e.tag === 0 ? xE(ay.bind(null, e)) : Km(ay.bind(null, e)),
          EE(function () {
            (Be & 6) === 0 && Dn();
          }),
          (s = null);
      else {
        switch (Zh(u)) {
          case 1:
            s = vr;
            break;
          case 4:
            s = ur;
            break;
          case 16:
            s = On;
            break;
          case 536870912:
            s = Wr;
            break;
          default:
            s = On;
        }
        s = hy(s, oy.bind(null, e));
      }
      (e.callbackPriority = t), (e.callbackNode = s);
    }
  }
  function oy(e, t) {
    if (((Ns = -1), (ks = 0), (Be & 6) !== 0)) throw Error(n(327));
    var s = e.callbackNode;
    if (Qi() && e.callbackNode !== s) return null;
    var u = qa(e, e === Ot ? At : 0);
    if (u === 0) return null;
    if ((u & 30) !== 0 || (u & e.expiredLanes) !== 0 || t) t = As(e, u);
    else {
      t = u;
      var f = Be;
      Be |= 2;
      var p = ly();
      (Ot !== e || At !== t) && ((vn = null), (Yi = Ve() + 500), gi(e, t));
      do
        try {
          WE();
          break;
        } catch (C) {
          sy(e, C);
        }
      while (!0);
      uu(), (xs.current = p), (Be = f), yt !== null ? (t = 0) : ((Ot = null), (At = 0), (t = _t));
    }
    if (t !== 0) {
      if ((t === 2 && ((f = Ol(e)), f !== 0 && ((u = f), (t = Vu(e, f)))), t === 1))
        throw ((s = Zo), gi(e, 0), Un(e, u), tr(e, Ve()), s);
      if (t === 6) Un(e, u);
      else {
        if (
          ((f = e.current.alternate),
          (u & 30) === 0 &&
            !KE(f) &&
            ((t = As(e, u)), t === 2 && ((p = Ol(e)), p !== 0 && ((u = p), (t = Vu(e, p)))), t === 1))
        )
          throw ((s = Zo), gi(e, 0), Un(e, u), tr(e, Ve()), s);
        switch (((e.finishedWork = f), (e.finishedLanes = u), t)) {
          case 0:
          case 1:
            throw Error(n(345));
          case 2:
            yi(e, er, vn);
            break;
          case 3:
            if ((Un(e, u), (u & 130023424) === u && ((t = Uu + 500 - Ve()), 10 < t))) {
              if (qa(e, 0) !== 0) break;
              if (((f = e.suspendedLanes), (f & u) !== u)) {
                Wt(), (e.pingedLanes |= e.suspendedLanes & f);
                break;
              }
              e.timeoutHandle = Zl(yi.bind(null, e, er, vn), t);
              break;
            }
            yi(e, er, vn);
            break;
          case 4:
            if ((Un(e, u), (u & 4194240) === u)) break;
            for (t = e.eventTimes, f = -1; 0 < u; ) {
              var v = 31 - Xe(u);
              (p = 1 << v), (v = t[v]), v > f && (f = v), (u &= ~p);
            }
            if (
              ((u = f),
              (u = Ve() - u),
              (u =
                (120 > u
                  ? 120
                  : 480 > u
                  ? 480
                  : 1080 > u
                  ? 1080
                  : 1920 > u
                  ? 1920
                  : 3e3 > u
                  ? 3e3
                  : 4320 > u
                  ? 4320
                  : 1960 * HE(u / 1960)) - u),
              10 < u)
            ) {
              e.timeoutHandle = Zl(yi.bind(null, e, er, vn), u);
              break;
            }
            yi(e, er, vn);
            break;
          case 5:
            yi(e, er, vn);
            break;
          default:
            throw Error(n(329));
        }
      }
    }
    return tr(e, Ve()), e.callbackNode === s ? oy.bind(null, e) : null;
  }
  function Vu(e, t) {
    var s = Jo;
    return (
      e.current.memoizedState.isDehydrated && (gi(e, t).flags |= 256),
      (e = As(e, t)),
      e !== 2 && ((t = er), (er = s), t !== null && Wu(t)),
      e
    );
  }
  function Wu(e) {
    er === null ? (er = e) : er.push.apply(er, e);
  }
  function KE(e) {
    for (var t = e; ; ) {
      if (t.flags & 16384) {
        var s = t.updateQueue;
        if (s !== null && ((s = s.stores), s !== null))
          for (var u = 0; u < s.length; u++) {
            var f = s[u],
              p = f.getSnapshot;
            f = f.value;
            try {
              if (!kr(p(), f)) return !1;
            } catch {
              return !1;
            }
          }
      }
      if (((s = t.child), t.subtreeFlags & 16384 && s !== null)) (s.return = t), (t = s);
      else {
        if (t === e) break;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e) return !0;
          t = t.return;
        }
        (t.sibling.return = t.return), (t = t.sibling);
      }
    }
    return !0;
  }
  function Un(e, t) {
    for (t &= ~Bu, t &= ~Ps, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
      var s = 31 - Xe(t),
        u = 1 << s;
      (e[s] = -1), (t &= ~u);
    }
  }
  function ay(e) {
    if ((Be & 6) !== 0) throw Error(n(327));
    Qi();
    var t = qa(e, 0);
    if ((t & 1) === 0) return tr(e, Ve()), null;
    var s = As(e, t);
    if (e.tag !== 0 && s === 2) {
      var u = Ol(e);
      u !== 0 && ((t = u), (s = Vu(e, u)));
    }
    if (s === 1) throw ((s = Zo), gi(e, 0), Un(e, t), tr(e, Ve()), s);
    if (s === 6) throw Error(n(345));
    return (e.finishedWork = e.current.alternate), (e.finishedLanes = t), yi(e, er, vn), tr(e, Ve()), null;
  }
  function Gu(e, t) {
    var s = Be;
    Be |= 1;
    try {
      return e(t);
    } finally {
      (Be = s), Be === 0 && ((Yi = Ve() + 500), as && Dn());
    }
  }
  function mi(e) {
    qn !== null && qn.tag === 0 && (Be & 6) === 0 && Qi();
    var t = Be;
    Be |= 1;
    var s = br.transition,
      u = We;
    try {
      if (((br.transition = null), (We = 1), e)) return e();
    } finally {
      (We = u), (br.transition = s), (Be = t), (Be & 6) === 0 && Dn();
    }
  }
  function Xu() {
    (pr = Xi.current), et(Xi);
  }
  function gi(e, t) {
    (e.finishedWork = null), (e.finishedLanes = 0);
    var s = e.timeoutHandle;
    if ((s !== -1 && ((e.timeoutHandle = -1), SE(s)), yt !== null))
      for (s = yt.return; s !== null; ) {
        var u = s;
        switch ((iu(u), u.tag)) {
          case 1:
            (u = u.type.childContextTypes), u != null && is();
            break;
          case 3:
            Vi(), et(Qt), et(jt), yu();
            break;
          case 5:
            mu(u);
            break;
          case 4:
            Vi();
            break;
          case 13:
            et(st);
            break;
          case 19:
            et(st);
            break;
          case 10:
            cu(u.type._context);
            break;
          case 22:
          case 23:
            Xu();
        }
        s = s.return;
      }
    if (
      ((Ot = e),
      (yt = e = Hn(e.current, null)),
      (At = pr = t),
      (_t = 0),
      (Zo = null),
      (Bu = Ps = hi = 0),
      (er = Jo = null),
      di !== null)
    ) {
      for (t = 0; t < di.length; t++)
        if (((s = di[t]), (u = s.interleaved), u !== null)) {
          s.interleaved = null;
          var f = u.next,
            p = s.pending;
          if (p !== null) {
            var v = p.next;
            (p.next = f), (u.next = v);
          }
          s.pending = u;
        }
      di = null;
    }
    return e;
  }
  function sy(e, t) {
    do {
      var s = yt;
      try {
        if ((uu(), (gs.current = _s), ys)) {
          for (var u = lt.memoizedState; u !== null; ) {
            var f = u.queue;
            f !== null && (f.pending = null), (u = u.next);
          }
          ys = !1;
        }
        if (
          ((pi = 0), (Ct = wt = lt = null), (Vo = !1), (Wo = 0), (qu.current = null), s === null || s.return === null)
        ) {
          (_t = 1), (Zo = t), (yt = null);
          break;
        }
        e: {
          var p = e,
            v = s.return,
            C = s,
            R = t;
          if (((t = At), (C.flags |= 32768), R !== null && typeof R == 'object' && typeof R.then == 'function')) {
            var B = R,
              Q = C,
              J = Q.tag;
            if ((Q.mode & 1) === 0 && (J === 0 || J === 11 || J === 15)) {
              var Y = Q.alternate;
              Y
                ? ((Q.updateQueue = Y.updateQueue), (Q.memoizedState = Y.memoizedState), (Q.lanes = Y.lanes))
                : ((Q.updateQueue = null), (Q.memoizedState = null));
            }
            var ae = kg(v);
            if (ae !== null) {
              (ae.flags &= -257), Ag(ae, v, C, p, t), ae.mode & 1 && Ng(p, B, t), (t = ae), (R = B);
              var he = t.updateQueue;
              if (he === null) {
                var ge = new Set();
                ge.add(R), (t.updateQueue = ge);
              } else he.add(R);
              break e;
            } else {
              if ((t & 1) === 0) {
                Ng(p, B, t), Yu();
                break e;
              }
              R = Error(n(426));
            }
          } else if (rt && C.mode & 1) {
            var pt = kg(v);
            if (pt !== null) {
              (pt.flags & 65536) === 0 && (pt.flags |= 256), Ag(pt, v, C, p, t), su(Wi(R, C));
              break e;
            }
          }
          (p = R = Wi(R, C)), _t !== 4 && (_t = 2), Jo === null ? (Jo = [p]) : Jo.push(p), (p = v);
          do {
            switch (p.tag) {
              case 3:
                (p.flags |= 65536), (t &= -t), (p.lanes |= t);
                var D = Rg(p, R, t);
                rg(p, D);
                break e;
              case 1:
                C = R;
                var N = p.type,
                  M = p.stateNode;
                if (
                  (p.flags & 128) === 0 &&
                  (typeof N.getDerivedStateFromError == 'function' ||
                    (M !== null && typeof M.componentDidCatch == 'function' && (zn === null || !zn.has(M))))
                ) {
                  (p.flags |= 65536), (t &= -t), (p.lanes |= t);
                  var re = Ig(p, C, t);
                  rg(p, re);
                  break e;
                }
            }
            p = p.return;
          } while (p !== null);
        }
        cy(s);
      } catch (_e) {
        (t = _e), yt === s && s !== null && (yt = s = s.return);
        continue;
      }
      break;
    } while (!0);
  }
  function ly() {
    var e = xs.current;
    return (xs.current = _s), e === null ? _s : e;
  }
  function Yu() {
    (_t === 0 || _t === 3 || _t === 2) && (_t = 4),
      Ot === null || ((hi & 268435455) === 0 && (Ps & 268435455) === 0) || Un(Ot, At);
  }
  function As(e, t) {
    var s = Be;
    Be |= 2;
    var u = ly();
    (Ot !== e || At !== t) && ((vn = null), gi(e, t));
    do
      try {
        VE();
        break;
      } catch (f) {
        sy(e, f);
      }
    while (!0);
    if ((uu(), (Be = s), (xs.current = u), yt !== null)) throw Error(n(261));
    return (Ot = null), (At = 0), _t;
  }
  function VE() {
    for (; yt !== null; ) uy(yt);
  }
  function WE() {
    for (; yt !== null && !Ke(); ) uy(yt);
  }
  function uy(e) {
    var t = py(e.alternate, e, pr);
    (e.memoizedProps = e.pendingProps), t === null ? cy(e) : (yt = t), (qu.current = null);
  }
  function cy(e) {
    var t = e;
    do {
      var s = t.alternate;
      if (((e = t.return), (t.flags & 32768) === 0)) {
        if (((s = $E(s, t, pr)), s !== null)) {
          yt = s;
          return;
        }
      } else {
        if (((s = zE(s, t)), s !== null)) {
          (s.flags &= 32767), (yt = s);
          return;
        }
        if (e !== null) (e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null);
        else {
          (_t = 6), (yt = null);
          return;
        }
      }
      if (((t = t.sibling), t !== null)) {
        yt = t;
        return;
      }
      yt = t = e;
    } while (t !== null);
    _t === 0 && (_t = 5);
  }
  function yi(e, t, s) {
    var u = We,
      f = br.transition;
    try {
      (br.transition = null), (We = 1), GE(e, t, s, u);
    } finally {
      (br.transition = f), (We = u);
    }
    return null;
  }
  function GE(e, t, s, u) {
    do Qi();
    while (qn !== null);
    if ((Be & 6) !== 0) throw Error(n(327));
    s = e.finishedWork;
    var f = e.finishedLanes;
    if (s === null) return null;
    if (((e.finishedWork = null), (e.finishedLanes = 0), s === e.current)) throw Error(n(177));
    (e.callbackNode = null), (e.callbackPriority = 0);
    var p = s.lanes | s.childLanes;
    if (
      (T1(e, p),
      e === Ot && ((yt = Ot = null), (At = 0)),
      ((s.subtreeFlags & 2064) === 0 && (s.flags & 2064) === 0) ||
        Rs ||
        ((Rs = !0),
        hy(On, function () {
          return Qi(), null;
        })),
      (p = (s.flags & 15990) !== 0),
      (s.subtreeFlags & 15990) !== 0 || p)
    ) {
      (p = br.transition), (br.transition = null);
      var v = We;
      We = 1;
      var C = Be;
      (Be |= 4),
        (qu.current = null),
        BE(e, s),
        ey(s, e),
        hE(Yl),
        (Ha = !!Xl),
        (Yl = Xl = null),
        (e.current = s),
        UE(s),
        Yt(),
        (Be = C),
        (We = v),
        (br.transition = p);
    } else e.current = s;
    if (
      (Rs && ((Rs = !1), (qn = e), (Is = f)),
      (p = e.pendingLanes),
      p === 0 && (zn = null),
      Fe(s.stateNode),
      tr(e, Ve()),
      t !== null)
    )
      for (u = e.onRecoverableError, s = 0; s < t.length; s++)
        (f = t[s]), u(f.value, { componentStack: f.stack, digest: f.digest });
    if (Ts) throw ((Ts = !1), (e = Hu), (Hu = null), e);
    return (
      (Is & 1) !== 0 && e.tag !== 0 && Qi(),
      (p = e.pendingLanes),
      (p & 1) !== 0 ? (e === Ku ? ea++ : ((ea = 0), (Ku = e))) : (ea = 0),
      Dn(),
      null
    );
  }
  function Qi() {
    if (qn !== null) {
      var e = Zh(Is),
        t = br.transition,
        s = We;
      try {
        if (((br.transition = null), (We = 16 > e ? 16 : e), qn === null)) var u = !1;
        else {
          if (((e = qn), (qn = null), (Is = 0), (Be & 6) !== 0)) throw Error(n(331));
          var f = Be;
          for (Be |= 4, ce = e.current; ce !== null; ) {
            var p = ce,
              v = p.child;
            if ((ce.flags & 16) !== 0) {
              var C = p.deletions;
              if (C !== null) {
                for (var R = 0; R < C.length; R++) {
                  var B = C[R];
                  for (ce = B; ce !== null; ) {
                    var Q = ce;
                    switch (Q.tag) {
                      case 0:
                      case 11:
                      case 15:
                        Qo(8, Q, p);
                    }
                    var J = Q.child;
                    if (J !== null) (J.return = Q), (ce = J);
                    else
                      for (; ce !== null; ) {
                        Q = ce;
                        var Y = Q.sibling,
                          ae = Q.return;
                        if ((Xg(Q), Q === B)) {
                          ce = null;
                          break;
                        }
                        if (Y !== null) {
                          (Y.return = ae), (ce = Y);
                          break;
                        }
                        ce = ae;
                      }
                  }
                }
                var he = p.alternate;
                if (he !== null) {
                  var ge = he.child;
                  if (ge !== null) {
                    he.child = null;
                    do {
                      var pt = ge.sibling;
                      (ge.sibling = null), (ge = pt);
                    } while (ge !== null);
                  }
                }
                ce = p;
              }
            }
            if ((p.subtreeFlags & 2064) !== 0 && v !== null) (v.return = p), (ce = v);
            else
              e: for (; ce !== null; ) {
                if (((p = ce), (p.flags & 2048) !== 0))
                  switch (p.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Qo(9, p, p.return);
                  }
                var D = p.sibling;
                if (D !== null) {
                  (D.return = p.return), (ce = D);
                  break e;
                }
                ce = p.return;
              }
          }
          var N = e.current;
          for (ce = N; ce !== null; ) {
            v = ce;
            var M = v.child;
            if ((v.subtreeFlags & 2064) !== 0 && M !== null) (M.return = v), (ce = M);
            else
              e: for (v = N; ce !== null; ) {
                if (((C = ce), (C.flags & 2048) !== 0))
                  try {
                    switch (C.tag) {
                      case 0:
                      case 11:
                      case 15:
                        Os(9, C);
                    }
                  } catch (_e) {
                    dt(C, C.return, _e);
                  }
                if (C === v) {
                  ce = null;
                  break e;
                }
                var re = C.sibling;
                if (re !== null) {
                  (re.return = C.return), (ce = re);
                  break e;
                }
                ce = C.return;
              }
          }
          if (((Be = f), Dn(), Kt && typeof Kt.onPostCommitFiberRoot == 'function'))
            try {
              Kt.onPostCommitFiberRoot(ln, e);
            } catch {}
          u = !0;
        }
        return u;
      } finally {
        (We = s), (br.transition = t);
      }
    }
    return !1;
  }
  function dy(e, t, s) {
    (t = Wi(s, t)), (t = Rg(e, t, 1)), (e = Fn(e, t, 1)), (t = Wt()), e !== null && (Co(e, 1, t), tr(e, t));
  }
  function dt(e, t, s) {
    if (e.tag === 3) dy(e, e, s);
    else
      for (; t !== null; ) {
        if (t.tag === 3) {
          dy(t, e, s);
          break;
        } else if (t.tag === 1) {
          var u = t.stateNode;
          if (
            typeof t.type.getDerivedStateFromError == 'function' ||
            (typeof u.componentDidCatch == 'function' && (zn === null || !zn.has(u)))
          ) {
            (e = Wi(s, e)), (e = Ig(t, e, 1)), (t = Fn(t, e, 1)), (e = Wt()), t !== null && (Co(t, 1, e), tr(t, e));
            break;
          }
        }
        t = t.return;
      }
  }
  function XE(e, t, s) {
    var u = e.pingCache;
    u !== null && u.delete(t),
      (t = Wt()),
      (e.pingedLanes |= e.suspendedLanes & s),
      Ot === e &&
        (At & s) === s &&
        (_t === 4 || (_t === 3 && (At & 130023424) === At && 500 > Ve() - Uu) ? gi(e, 0) : (Bu |= s)),
      tr(e, t);
  }
  function fy(e, t) {
    t === 0 && ((e.mode & 1) === 0 ? (t = 1) : ((t = oi), (oi <<= 1), (oi & 130023424) === 0 && (oi = 4194304)));
    var s = Wt();
    (e = mn(e, t)), e !== null && (Co(e, t, s), tr(e, s));
  }
  function YE(e) {
    var t = e.memoizedState,
      s = 0;
    t !== null && (s = t.retryLane), fy(e, s);
  }
  function QE(e, t) {
    var s = 0;
    switch (e.tag) {
      case 13:
        var u = e.stateNode,
          f = e.memoizedState;
        f !== null && (s = f.retryLane);
        break;
      case 19:
        u = e.stateNode;
        break;
      default:
        throw Error(n(314));
    }
    u !== null && u.delete(t), fy(e, s);
  }
  var py;
  py = function (e, t, s) {
    if (e !== null)
      if (e.memoizedProps !== t.pendingProps || Qt.current) Jt = !0;
      else {
        if ((e.lanes & s) === 0 && (t.flags & 128) === 0) return (Jt = !1), FE(e, t, s);
        Jt = (e.flags & 131072) !== 0;
      }
    else (Jt = !1), rt && (t.flags & 1048576) !== 0 && Vm(t, ls, t.index);
    switch (((t.lanes = 0), t.tag)) {
      case 2:
        var u = t.type;
        bs(e, t), (e = t.pendingProps);
        var f = $i(t, jt.current);
        Ki(t, s), (f = _u(null, t, u, e, f, s));
        var p = Su();
        return (
          (t.flags |= 1),
          typeof f == 'object' && f !== null && typeof f.render == 'function' && f.$$typeof === void 0
            ? ((t.tag = 1),
              (t.memoizedState = null),
              (t.updateQueue = null),
              Zt(u) ? ((p = !0), os(t)) : (p = !1),
              (t.memoizedState = f.state !== null && f.state !== void 0 ? f.state : null),
              pu(t),
              (f.updater = Ss),
              (t.stateNode = f),
              (f._reactInternals = t),
              Pu(t, u, e, s),
              (t = Nu(null, t, u, !0, p, s)))
            : ((t.tag = 0), rt && p && nu(t), Vt(null, t, f, s), (t = t.child)),
          t
        );
      case 16:
        u = t.elementType;
        e: {
          switch (
            (bs(e, t),
            (e = t.pendingProps),
            (f = u._init),
            (u = f(u._payload)),
            (t.type = u),
            (f = t.tag = JE(u)),
            (e = Lr(u, e)),
            f)
          ) {
            case 0:
              t = Iu(null, t, u, e, s);
              break e;
            case 1:
              t = $g(null, t, u, e, s);
              break e;
            case 11:
              t = Lg(null, t, u, e, s);
              break e;
            case 14:
              t = jg(null, t, u, Lr(u.type, e), s);
              break e;
          }
          throw Error(n(306, u, ''));
        }
        return t;
      case 0:
        return (u = t.type), (f = t.pendingProps), (f = t.elementType === u ? f : Lr(u, f)), Iu(e, t, u, f, s);
      case 1:
        return (u = t.type), (f = t.pendingProps), (f = t.elementType === u ? f : Lr(u, f)), $g(e, t, u, f, s);
      case 3:
        e: {
          if ((zg(t), e === null)) throw Error(n(387));
          (u = t.pendingProps), (p = t.memoizedState), (f = p.element), tg(e, t), hs(t, u, null, s);
          var v = t.memoizedState;
          if (((u = v.element), p.isDehydrated))
            if (
              ((p = {
                element: u,
                isDehydrated: !1,
                cache: v.cache,
                pendingSuspenseBoundaries: v.pendingSuspenseBoundaries,
                transitions: v.transitions,
              }),
              (t.updateQueue.baseState = p),
              (t.memoizedState = p),
              t.flags & 256)
            ) {
              (f = Wi(Error(n(423)), t)), (t = qg(e, t, u, s, f));
              break e;
            } else if (u !== f) {
              (f = Wi(Error(n(424)), t)), (t = qg(e, t, u, s, f));
              break e;
            } else
              for (
                fr = An(t.stateNode.containerInfo.firstChild),
                  dr = t,
                  rt = !0,
                  Ar = null,
                  s = Jm(t, null, u, s),
                  t.child = s;
                s;

              )
                (s.flags = (s.flags & -3) | 4096), (s = s.sibling);
          else {
            if ((Bi(), u === f)) {
              t = yn(e, t, s);
              break e;
            }
            Vt(e, t, u, s);
          }
          t = t.child;
        }
        return t;
      case 5:
        return (
          ig(t),
          e === null && au(t),
          (u = t.type),
          (f = t.pendingProps),
          (p = e !== null ? e.memoizedProps : null),
          (v = f.children),
          Ql(u, f) ? (v = null) : p !== null && Ql(u, p) && (t.flags |= 32),
          Fg(e, t),
          Vt(e, t, v, s),
          t.child
        );
      case 6:
        return e === null && au(t), null;
      case 13:
        return Bg(e, t, s);
      case 4:
        return (
          hu(t, t.stateNode.containerInfo),
          (u = t.pendingProps),
          e === null ? (t.child = Ui(t, null, u, s)) : Vt(e, t, u, s),
          t.child
        );
      case 11:
        return (u = t.type), (f = t.pendingProps), (f = t.elementType === u ? f : Lr(u, f)), Lg(e, t, u, f, s);
      case 7:
        return Vt(e, t, t.pendingProps, s), t.child;
      case 8:
        return Vt(e, t, t.pendingProps.children, s), t.child;
      case 12:
        return Vt(e, t, t.pendingProps.children, s), t.child;
      case 10:
        e: {
          if (
            ((u = t.type._context),
            (f = t.pendingProps),
            (p = t.memoizedProps),
            (v = f.value),
            Qe(ds, u._currentValue),
            (u._currentValue = v),
            p !== null)
          )
            if (kr(p.value, v)) {
              if (p.children === f.children && !Qt.current) {
                t = yn(e, t, s);
                break e;
              }
            } else
              for (p = t.child, p !== null && (p.return = t); p !== null; ) {
                var C = p.dependencies;
                if (C !== null) {
                  v = p.child;
                  for (var R = C.firstContext; R !== null; ) {
                    if (R.context === u) {
                      if (p.tag === 1) {
                        (R = gn(-1, s & -s)), (R.tag = 2);
                        var B = p.updateQueue;
                        if (B !== null) {
                          B = B.shared;
                          var Q = B.pending;
                          Q === null ? (R.next = R) : ((R.next = Q.next), (Q.next = R)), (B.pending = R);
                        }
                      }
                      (p.lanes |= s),
                        (R = p.alternate),
                        R !== null && (R.lanes |= s),
                        du(p.return, s, t),
                        (C.lanes |= s);
                      break;
                    }
                    R = R.next;
                  }
                } else if (p.tag === 10) v = p.type === t.type ? null : p.child;
                else if (p.tag === 18) {
                  if (((v = p.return), v === null)) throw Error(n(341));
                  (v.lanes |= s), (C = v.alternate), C !== null && (C.lanes |= s), du(v, s, t), (v = p.sibling);
                } else v = p.child;
                if (v !== null) v.return = p;
                else
                  for (v = p; v !== null; ) {
                    if (v === t) {
                      v = null;
                      break;
                    }
                    if (((p = v.sibling), p !== null)) {
                      (p.return = v.return), (v = p);
                      break;
                    }
                    v = v.return;
                  }
                p = v;
              }
          Vt(e, t, f.children, s), (t = t.child);
        }
        return t;
      case 9:
        return (
          (f = t.type),
          (u = t.pendingProps.children),
          Ki(t, s),
          (f = Sr(f)),
          (u = u(f)),
          (t.flags |= 1),
          Vt(e, t, u, s),
          t.child
        );
      case 14:
        return (u = t.type), (f = Lr(u, t.pendingProps)), (f = Lr(u.type, f)), jg(e, t, u, f, s);
      case 15:
        return Dg(e, t, t.type, t.pendingProps, s);
      case 17:
        return (
          (u = t.type),
          (f = t.pendingProps),
          (f = t.elementType === u ? f : Lr(u, f)),
          bs(e, t),
          (t.tag = 1),
          Zt(u) ? ((e = !0), os(t)) : (e = !1),
          Ki(t, s),
          Pg(t, u, f),
          Pu(t, u, f, s),
          Nu(null, t, u, !0, e, s)
        );
      case 19:
        return Hg(e, t, s);
      case 22:
        return Mg(e, t, s);
    }
    throw Error(n(156, t.tag));
  };
  function hy(e, t) {
    return ft(e, t);
  }
  function ZE(e, t, s, u) {
    (this.tag = e),
      (this.key = s),
      (this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null),
      (this.index = 0),
      (this.ref = null),
      (this.pendingProps = t),
      (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
      (this.mode = u),
      (this.subtreeFlags = this.flags = 0),
      (this.deletions = null),
      (this.childLanes = this.lanes = 0),
      (this.alternate = null);
  }
  function Cr(e, t, s, u) {
    return new ZE(e, t, s, u);
  }
  function Qu(e) {
    return (e = e.prototype), !(!e || !e.isReactComponent);
  }
  function JE(e) {
    if (typeof e == 'function') return Qu(e) ? 1 : 0;
    if (e != null) {
      if (((e = e.$$typeof), e === oe)) return 11;
      if (e === me) return 14;
    }
    return 2;
  }
  function Hn(e, t) {
    var s = e.alternate;
    return (
      s === null
        ? ((s = Cr(e.tag, t, e.key, e.mode)),
          (s.elementType = e.elementType),
          (s.type = e.type),
          (s.stateNode = e.stateNode),
          (s.alternate = e),
          (e.alternate = s))
        : ((s.pendingProps = t), (s.type = e.type), (s.flags = 0), (s.subtreeFlags = 0), (s.deletions = null)),
      (s.flags = e.flags & 14680064),
      (s.childLanes = e.childLanes),
      (s.lanes = e.lanes),
      (s.child = e.child),
      (s.memoizedProps = e.memoizedProps),
      (s.memoizedState = e.memoizedState),
      (s.updateQueue = e.updateQueue),
      (t = e.dependencies),
      (s.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
      (s.sibling = e.sibling),
      (s.index = e.index),
      (s.ref = e.ref),
      s
    );
  }
  function Ls(e, t, s, u, f, p) {
    var v = 2;
    if (((u = e), typeof e == 'function')) Qu(e) && (v = 1);
    else if (typeof e == 'string') v = 5;
    else
      e: switch (e) {
        case b:
          return vi(s.children, f, p, t);
        case q:
          (v = 8), (f |= 8);
          break;
        case W:
          return (e = Cr(12, s, t, f | 2)), (e.elementType = W), (e.lanes = p), e;
        case ie:
          return (e = Cr(13, s, t, f)), (e.elementType = ie), (e.lanes = p), e;
        case fe:
          return (e = Cr(19, s, t, f)), (e.elementType = fe), (e.lanes = p), e;
        case Te:
          return js(s, f, p, t);
        default:
          if (typeof e == 'object' && e !== null)
            switch (e.$$typeof) {
              case X:
                v = 10;
                break e;
              case G:
                v = 9;
                break e;
              case oe:
                v = 11;
                break e;
              case me:
                v = 14;
                break e;
              case be:
                (v = 16), (u = null);
                break e;
            }
          throw Error(n(130, e == null ? e : typeof e, ''));
      }
    return (t = Cr(v, s, t, f)), (t.elementType = e), (t.type = u), (t.lanes = p), t;
  }
  function vi(e, t, s, u) {
    return (e = Cr(7, e, u, t)), (e.lanes = s), e;
  }
  function js(e, t, s, u) {
    return (e = Cr(22, e, u, t)), (e.elementType = Te), (e.lanes = s), (e.stateNode = { isHidden: !1 }), e;
  }
  function Zu(e, t, s) {
    return (e = Cr(6, e, null, t)), (e.lanes = s), e;
  }
  function Ju(e, t, s) {
    return (
      (t = Cr(4, e.children !== null ? e.children : [], e.key, t)),
      (t.lanes = s),
      (t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }),
      t
    );
  }
  function eb(e, t, s, u, f) {
    (this.tag = t),
      (this.containerInfo = e),
      (this.finishedWork = this.pingCache = this.current = this.pendingChildren = null),
      (this.timeoutHandle = -1),
      (this.callbackNode = this.pendingContext = this.context = null),
      (this.callbackPriority = 0),
      (this.eventTimes = xl(0)),
      (this.expirationTimes = xl(-1)),
      (this.entangledLanes =
        this.finishedLanes =
        this.mutableReadLanes =
        this.expiredLanes =
        this.pingedLanes =
        this.suspendedLanes =
        this.pendingLanes =
          0),
      (this.entanglements = xl(0)),
      (this.identifierPrefix = u),
      (this.onRecoverableError = f),
      (this.mutableSourceEagerHydrationData = null);
  }
  function ec(e, t, s, u, f, p, v, C, R) {
    return (
      (e = new eb(e, t, s, C, R)),
      t === 1 ? ((t = 1), p === !0 && (t |= 8)) : (t = 0),
      (p = Cr(3, null, null, t)),
      (e.current = p),
      (p.stateNode = e),
      (p.memoizedState = {
        element: u,
        isDehydrated: s,
        cache: null,
        transitions: null,
        pendingSuspenseBoundaries: null,
      }),
      pu(p),
      e
    );
  }
  function tb(e, t, s) {
    var u = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: F, key: u == null ? null : '' + u, children: e, containerInfo: t, implementation: s };
  }
  function my(e) {
    if (!e) return jn;
    e = e._reactInternals;
    e: {
      if (ve(e) !== e || e.tag !== 1) throw Error(n(170));
      var t = e;
      do {
        switch (t.tag) {
          case 3:
            t = t.stateNode.context;
            break e;
          case 1:
            if (Zt(t.type)) {
              t = t.stateNode.__reactInternalMemoizedMergedChildContext;
              break e;
            }
        }
        t = t.return;
      } while (t !== null);
      throw Error(n(171));
    }
    if (e.tag === 1) {
      var s = e.type;
      if (Zt(s)) return Um(e, s, t);
    }
    return t;
  }
  function gy(e, t, s, u, f, p, v, C, R) {
    return (
      (e = ec(s, u, !0, e, f, p, v, C, R)),
      (e.context = my(null)),
      (s = e.current),
      (u = Wt()),
      (f = Bn(s)),
      (p = gn(u, f)),
      (p.callback = t ?? null),
      Fn(s, p, f),
      (e.current.lanes = f),
      Co(e, f, u),
      tr(e, u),
      e
    );
  }
  function Ds(e, t, s, u) {
    var f = t.current,
      p = Wt(),
      v = Bn(f);
    return (
      (s = my(s)),
      t.context === null ? (t.context = s) : (t.pendingContext = s),
      (t = gn(p, v)),
      (t.payload = { element: e }),
      (u = u === void 0 ? null : u),
      u !== null && (t.callback = u),
      (e = Fn(f, t, v)),
      e !== null && (Mr(e, f, v, p), ps(e, f, v)),
      v
    );
  }
  function Ms(e) {
    return (e = e.current), e.child ? (e.child.tag === 5, e.child.stateNode) : null;
  }
  function yy(e, t) {
    if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
      var s = e.retryLane;
      e.retryLane = s !== 0 && s < t ? s : t;
    }
  }
  function tc(e, t) {
    yy(e, t), (e = e.alternate) && yy(e, t);
  }
  function rb() {
    return null;
  }
  var vy =
    typeof reportError == 'function'
      ? reportError
      : function (e) {
          console.error(e);
        };
  function rc(e) {
    this._internalRoot = e;
  }
  (Fs.prototype.render = rc.prototype.render =
    function (e) {
      var t = this._internalRoot;
      if (t === null) throw Error(n(409));
      Ds(e, t, null, null);
    }),
    (Fs.prototype.unmount = rc.prototype.unmount =
      function () {
        var e = this._internalRoot;
        if (e !== null) {
          this._internalRoot = null;
          var t = e.containerInfo;
          mi(function () {
            Ds(null, e, null, null);
          }),
            (t[dn] = null);
        }
      });
  function Fs(e) {
    this._internalRoot = e;
  }
  Fs.prototype.unstable_scheduleHydration = function (e) {
    if (e) {
      var t = tm();
      e = { blockedOn: null, target: e, priority: t };
      for (var s = 0; s < In.length && t !== 0 && t < In[s].priority; s++);
      In.splice(s, 0, e), s === 0 && im(e);
    }
  };
  function nc(e) {
    return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
  }
  function $s(e) {
    return !(
      !e ||
      (e.nodeType !== 1 &&
        e.nodeType !== 9 &&
        e.nodeType !== 11 &&
        (e.nodeType !== 8 || e.nodeValue !== ' react-mount-point-unstable '))
    );
  }
  function wy() {}
  function nb(e, t, s, u, f) {
    if (f) {
      if (typeof u == 'function') {
        var p = u;
        u = function () {
          var B = Ms(v);
          p.call(B);
        };
      }
      var v = gy(t, u, e, 0, null, !1, !1, '', wy);
      return (e._reactRootContainer = v), (e[dn] = v.current), Fo(e.nodeType === 8 ? e.parentNode : e), mi(), v;
    }
    for (; (f = e.lastChild); ) e.removeChild(f);
    if (typeof u == 'function') {
      var C = u;
      u = function () {
        var B = Ms(R);
        C.call(B);
      };
    }
    var R = ec(e, 0, !1, null, null, !1, !1, '', wy);
    return (
      (e._reactRootContainer = R),
      (e[dn] = R.current),
      Fo(e.nodeType === 8 ? e.parentNode : e),
      mi(function () {
        Ds(t, R, s, u);
      }),
      R
    );
  }
  function zs(e, t, s, u, f) {
    var p = s._reactRootContainer;
    if (p) {
      var v = p;
      if (typeof f == 'function') {
        var C = f;
        f = function () {
          var R = Ms(v);
          C.call(R);
        };
      }
      Ds(t, v, e, f);
    } else v = nb(s, t, e, f, u);
    return Ms(v);
  }
  (Jh = function (e) {
    switch (e.tag) {
      case 3:
        var t = e.stateNode;
        if (t.current.memoizedState.isDehydrated) {
          var s = ai(t.pendingLanes);
          s !== 0 && (Pl(t, s | 1), tr(t, Ve()), (Be & 6) === 0 && ((Yi = Ve() + 500), Dn()));
        }
        break;
      case 13:
        mi(function () {
          var u = mn(e, 1);
          if (u !== null) {
            var f = Wt();
            Mr(u, e, 1, f);
          }
        }),
          tc(e, 1);
    }
  }),
    (Tl = function (e) {
      if (e.tag === 13) {
        var t = mn(e, 134217728);
        if (t !== null) {
          var s = Wt();
          Mr(t, e, 134217728, s);
        }
        tc(e, 134217728);
      }
    }),
    (em = function (e) {
      if (e.tag === 13) {
        var t = Bn(e),
          s = mn(e, t);
        if (s !== null) {
          var u = Wt();
          Mr(s, e, t, u);
        }
        tc(e, t);
      }
    }),
    (tm = function () {
      return We;
    }),
    (rm = function (e, t) {
      var s = We;
      try {
        return (We = e), t();
      } finally {
        We = s;
      }
    }),
    (gr = function (e, t, s) {
      switch (t) {
        case 'input':
          if ((je(e, s), (t = s.name), s.type === 'radio' && t != null)) {
            for (s = e; s.parentNode; ) s = s.parentNode;
            for (
              s = s.querySelectorAll('input[name=' + JSON.stringify('' + t) + '][type="radio"]'), t = 0;
              t < s.length;
              t++
            ) {
              var u = s[t];
              if (u !== e && u.form === e.form) {
                var f = ns(u);
                if (!f) throw Error(n(90));
                it(u), je(u, f);
              }
            }
          }
          break;
        case 'textarea':
          vt(e, s);
          break;
        case 'select':
          (t = s.value), t != null && ct(e, !!s.multiple, t, !1);
      }
    }),
    (bn = Gu),
    (Vr = mi);
  var ib = { usingClientEntryPoint: !1, Events: [qo, Mi, ns, yr, sn, Gu] },
    ta = { findFiberByHostInstance: si, bundleType: 0, version: '18.3.1', rendererPackageName: 'react-dom' },
    ob = {
      bundleType: ta.bundleType,
      version: ta.version,
      rendererPackageName: ta.rendererPackageName,
      rendererConfig: ta.rendererConfig,
      overrideHookState: null,
      overrideHookStateDeletePath: null,
      overrideHookStateRenamePath: null,
      overrideProps: null,
      overridePropsDeletePath: null,
      overridePropsRenamePath: null,
      setErrorHandler: null,
      setSuspenseHandler: null,
      scheduleUpdate: null,
      currentDispatcherRef: H.ReactCurrentDispatcher,
      findHostInstanceByFiber: function (e) {
        return (e = Me(e)), e === null ? null : e.stateNode;
      },
      findFiberByHostInstance: ta.findFiberByHostInstance || rb,
      findHostInstancesForRefresh: null,
      scheduleRefresh: null,
      scheduleRoot: null,
      setRefreshHandler: null,
      getCurrentFiber: null,
      reconcilerVersion: '18.3.1-next-f1338f8080-20240426',
    };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
    var qs = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!qs.isDisabled && qs.supportsFiber)
      try {
        (ln = qs.inject(ob)), (Kt = qs);
      } catch {}
  }
  return (
    (rr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ib),
    (rr.createPortal = function (e, t) {
      var s = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
      if (!nc(t)) throw Error(n(200));
      return tb(e, t, null, s);
    }),
    (rr.createRoot = function (e, t) {
      if (!nc(e)) throw Error(n(299));
      var s = !1,
        u = '',
        f = vy;
      return (
        t != null &&
          (t.unstable_strictMode === !0 && (s = !0),
          t.identifierPrefix !== void 0 && (u = t.identifierPrefix),
          t.onRecoverableError !== void 0 && (f = t.onRecoverableError)),
        (t = ec(e, 1, !1, null, null, s, !1, u, f)),
        (e[dn] = t.current),
        Fo(e.nodeType === 8 ? e.parentNode : e),
        new rc(t)
      );
    }),
    (rr.findDOMNode = function (e) {
      if (e == null) return null;
      if (e.nodeType === 1) return e;
      var t = e._reactInternals;
      if (t === void 0)
        throw typeof e.render == 'function' ? Error(n(188)) : ((e = Object.keys(e).join(',')), Error(n(268, e)));
      return (e = Me(t)), (e = e === null ? null : e.stateNode), e;
    }),
    (rr.flushSync = function (e) {
      return mi(e);
    }),
    (rr.hydrate = function (e, t, s) {
      if (!$s(t)) throw Error(n(200));
      return zs(null, e, t, !0, s);
    }),
    (rr.hydrateRoot = function (e, t, s) {
      if (!nc(e)) throw Error(n(405));
      var u = (s != null && s.hydratedSources) || null,
        f = !1,
        p = '',
        v = vy;
      if (
        (s != null &&
          (s.unstable_strictMode === !0 && (f = !0),
          s.identifierPrefix !== void 0 && (p = s.identifierPrefix),
          s.onRecoverableError !== void 0 && (v = s.onRecoverableError)),
        (t = gy(t, null, e, 1, s ?? null, f, !1, p, v)),
        (e[dn] = t.current),
        Fo(e),
        u)
      )
        for (e = 0; e < u.length; e++)
          (s = u[e]),
            (f = s._getVersion),
            (f = f(s._source)),
            t.mutableSourceEagerHydrationData == null
              ? (t.mutableSourceEagerHydrationData = [s, f])
              : t.mutableSourceEagerHydrationData.push(s, f);
      return new Fs(t);
    }),
    (rr.render = function (e, t, s) {
      if (!$s(t)) throw Error(n(200));
      return zs(null, e, t, !1, s);
    }),
    (rr.unmountComponentAtNode = function (e) {
      if (!$s(e)) throw Error(n(40));
      return e._reactRootContainer
        ? (mi(function () {
            zs(null, null, e, !1, function () {
              (e._reactRootContainer = null), (e[dn] = null);
            });
          }),
          !0)
        : !1;
    }),
    (rr.unstable_batchedUpdates = Gu),
    (rr.unstable_renderSubtreeIntoContainer = function (e, t, s, u) {
      if (!$s(s)) throw Error(n(200));
      if (e == null || e._reactInternals === void 0) throw Error(n(38));
      return zs(e, t, s, !1, u);
    }),
    (rr.version = '18.3.1-next-f1338f8080-20240426'),
    rr
  );
}
var Py;
function oS() {
  if (Py) return ac.exports;
  Py = 1;
  function i() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i);
      } catch (r) {
        console.error(r);
      }
  }
  return i(), (ac.exports = hb()), ac.exports;
}
var Ty;
function mb() {
  if (Ty) return Us;
  Ty = 1;
  var i = oS();
  return (Us.createRoot = i.createRoot), (Us.hydrateRoot = i.hydrateRoot), Us;
}
var gb = mb();
var aS = i => {
    throw TypeError(i);
  },
  yb = (i, r, n) => r.has(i) || aS('Cannot ' + n),
  uc = (i, r, n) => (yb(i, r, 'read from private field'), n ? n.call(i) : r.get(i)),
  vb = (i, r, n) =>
    r.has(i) ? aS('Cannot add the same private member more than once') : r instanceof WeakSet ? r.add(i) : r.set(i, n),
  Ry = 'popstate';
function wb(i = {}) {
  function r(o, a) {
    let { pathname: l, search: c, hash: d } = o.location;
    return ya(
      '',
      { pathname: l, search: c, hash: d },
      (a.state && a.state.usr) || null,
      (a.state && a.state.key) || 'default'
    );
  }
  function n(o, a) {
    return typeof a == 'string' ? a : rn(a);
  }
  return Sb(r, n, null, i);
}
function Le(i, r) {
  if (i === !1 || i === null || typeof i > 'u') throw new Error(r);
}
function ht(i, r) {
  if (!i) {
    typeof console < 'u' && console.warn(r);
    try {
      throw new Error(r);
    } catch {}
  }
}
function _b() {
  return Math.random().toString(36).substring(2, 10);
}
function Iy(i, r) {
  return { usr: i.state, key: i.key, idx: r };
}
function ya(i, r, n = null, o) {
  return {
    pathname: typeof i == 'string' ? i : i.pathname,
    search: '',
    hash: '',
    ...(typeof r == 'string' ? Jn(r) : r),
    state: n,
    key: (r && r.key) || o || _b(),
  };
}
function rn({ pathname: i = '/', search: r = '', hash: n = '' }) {
  return (
    r && r !== '?' && (i += r.charAt(0) === '?' ? r : '?' + r),
    n && n !== '#' && (i += n.charAt(0) === '#' ? n : '#' + n),
    i
  );
}
function Jn(i) {
  let r = {};
  if (i) {
    let n = i.indexOf('#');
    n >= 0 && ((r.hash = i.substring(n)), (i = i.substring(0, n)));
    let o = i.indexOf('?');
    o >= 0 && ((r.search = i.substring(o)), (i = i.substring(0, o))), i && (r.pathname = i);
  }
  return r;
}
function Sb(i, r, n, o = {}) {
  let { window: a = document.defaultView, v5Compat: l = !1 } = o,
    c = a.history,
    d = 'POP',
    h = null,
    g = y();
  g == null && ((g = 0), c.replaceState({ ...c.state, idx: g }, ''));
  function y() {
    return (c.state || { idx: null }).idx;
  }
  function w() {
    d = 'POP';
    let O = y(),
      L = O == null ? null : O - g;
    (g = O), h && h({ action: d, location: T.location, delta: L });
  }
  function S(O, L) {
    d = 'PUSH';
    let I = ya(T.location, O, L);
    g = y() + 1;
    let $ = Iy(I, g),
      H = T.createHref(I);
    try {
      c.pushState($, '', H);
    } catch (V) {
      if (V instanceof DOMException && V.name === 'DataCloneError') throw V;
      a.location.assign(H);
    }
    l && h && h({ action: d, location: T.location, delta: 1 });
  }
  function _(O, L) {
    d = 'REPLACE';
    let I = ya(T.location, O, L);
    g = y();
    let $ = Iy(I, g),
      H = T.createHref(I);
    c.replaceState($, '', H), l && h && h({ action: d, location: T.location, delta: 0 });
  }
  function x(O) {
    return sS(O);
  }
  let T = {
    get action() {
      return d;
    },
    get location() {
      return i(a, c);
    },
    listen(O) {
      if (h) throw new Error('A history only accepts one active listener');
      return (
        a.addEventListener(Ry, w),
        (h = O),
        () => {
          a.removeEventListener(Ry, w), (h = null);
        }
      );
    },
    createHref(O) {
      return r(a, O);
    },
    createURL: x,
    encodeLocation(O) {
      let L = x(O);
      return { pathname: L.pathname, search: L.search, hash: L.hash };
    },
    push: S,
    replace: _,
    go(O) {
      return c.go(O);
    },
  };
  return T;
}
function sS(i, r = !1) {
  let n = 'http://localhost';
  typeof window < 'u' && (n = window.location.origin !== 'null' ? window.location.origin : window.location.href),
    Le(n, 'No window.location.(origin|href) available to create URL');
  let o = typeof i == 'string' ? i : rn(i);
  return (o = o.replace(/ $/, '%20')), !r && o.startsWith('//') && (o = n + o), new URL(o, n);
}
var ua,
  Ny = class {
    constructor(i) {
      if ((vb(this, ua, new Map()), i)) for (let [r, n] of i) this.set(r, n);
    }
    get(i) {
      if (uc(this, ua).has(i)) return uc(this, ua).get(i);
      if (i.defaultValue !== void 0) return i.defaultValue;
      throw new Error('No value found for context');
    }
    set(i, r) {
      uc(this, ua).set(i, r);
    }
  };
ua = new WeakMap();
var Eb = new Set(['lazy', 'caseSensitive', 'path', 'id', 'index', 'children']);
function bb(i) {
  return Eb.has(i);
}
var Cb = new Set(['lazy', 'caseSensitive', 'path', 'id', 'index', 'middleware', 'children']);
function Ob(i) {
  return Cb.has(i);
}
function xb(i) {
  return i.index === !0;
}
function va(i, r, n = [], o = {}, a = !1) {
  return i.map((l, c) => {
    let d = [...n, String(c)],
      h = typeof l.id == 'string' ? l.id : d.join('-');
    if (
      (Le(l.index !== !0 || !l.children, 'Cannot specify children on an index route'),
      Le(
        a || !o[h],
        `Found a route id collision on id "${h}".  Route id's must be globally unique within Data Router usages`
      ),
      xb(l))
    ) {
      let g = { ...l, id: h };
      return (o[h] = ky(g, r(g))), g;
    } else {
      let g = { ...l, id: h, children: void 0 };
      return (o[h] = ky(g, r(g))), l.children && (g.children = va(l.children, r, d, o, a)), g;
    }
  });
}
function ky(i, r) {
  return Object.assign(i, {
    ...r,
    ...(typeof r.lazy == 'object' && r.lazy != null ? { lazy: { ...i.lazy, ...r.lazy } } : {}),
  });
}
function Gn(i, r, n = '/') {
  return ca(i, r, n, !1);
}
function ca(i, r, n, o) {
  let a = typeof r == 'string' ? Jn(r) : r,
    l = xr(a.pathname || '/', n);
  if (l == null) return null;
  let c = lS(i);
  Tb(c);
  let d = null;
  for (let h = 0; d == null && h < c.length; ++h) {
    let g = $b(l);
    d = Mb(c[h], g, o);
  }
  return d;
}
function Pb(i, r) {
  let { route: n, pathname: o, params: a } = i;
  return { id: n.id, pathname: o, params: a, data: r[n.id], loaderData: r[n.id], handle: n.handle };
}
function lS(i, r = [], n = [], o = '', a = !1) {
  let l = (c, d, h = a, g) => {
    let y = {
      relativePath: g === void 0 ? c.path || '' : g,
      caseSensitive: c.caseSensitive === !0,
      childrenIndex: d,
      route: c,
    };
    if (y.relativePath.startsWith('/')) {
      if (!y.relativePath.startsWith(o) && h) return;
      Le(
        y.relativePath.startsWith(o),
        `Absolute route path "${y.relativePath}" nested under path "${o}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`
      ),
        (y.relativePath = y.relativePath.slice(o.length));
    }
    let w = Jr([o, y.relativePath]),
      S = n.concat(y);
    c.children &&
      c.children.length > 0 &&
      (Le(
        c.index !== !0,
        `Index routes must not have child routes. Please remove all child routes from route path "${w}".`
      ),
      lS(c.children, r, S, w, h)),
      !(c.path == null && !c.index) && r.push({ path: w, score: jb(w, c.index), routesMeta: S });
  };
  return (
    i.forEach((c, d) => {
      if (c.path === '' || !c.path?.includes('?')) l(c, d);
      else for (let h of uS(c.path)) l(c, d, !0, h);
    }),
    r
  );
}
function uS(i) {
  let r = i.split('/');
  if (r.length === 0) return [];
  let [n, ...o] = r,
    a = n.endsWith('?'),
    l = n.replace(/\?$/, '');
  if (o.length === 0) return a ? [l, ''] : [l];
  let c = uS(o.join('/')),
    d = [];
  return (
    d.push(...c.map(h => (h === '' ? l : [l, h].join('/')))),
    a && d.push(...c),
    d.map(h => (i.startsWith('/') && h === '' ? '/' : h))
  );
}
function Tb(i) {
  i.sort((r, n) =>
    r.score !== n.score
      ? n.score - r.score
      : Db(
          r.routesMeta.map(o => o.childrenIndex),
          n.routesMeta.map(o => o.childrenIndex)
        )
  );
}
var Rb = /^:[\w-]+$/,
  Ib = 3,
  Nb = 2,
  kb = 1,
  Ab = 10,
  Lb = -2,
  Ay = i => i === '*';
function jb(i, r) {
  let n = i.split('/'),
    o = n.length;
  return (
    n.some(Ay) && (o += Lb),
    r && (o += Nb),
    n.filter(a => !Ay(a)).reduce((a, l) => a + (Rb.test(l) ? Ib : l === '' ? kb : Ab), o)
  );
}
function Db(i, r) {
  return i.length === r.length && i.slice(0, -1).every((o, a) => o === r[a]) ? i[i.length - 1] - r[r.length - 1] : 0;
}
function Mb(i, r, n = !1) {
  let { routesMeta: o } = i,
    a = {},
    l = '/',
    c = [];
  for (let d = 0; d < o.length; ++d) {
    let h = o[d],
      g = d === o.length - 1,
      y = l === '/' ? r : r.slice(l.length) || '/',
      w = rl({ path: h.relativePath, caseSensitive: h.caseSensitive, end: g }, y),
      S = h.route;
    if (
      (!w &&
        g &&
        n &&
        !o[o.length - 1].route.index &&
        (w = rl({ path: h.relativePath, caseSensitive: h.caseSensitive, end: !1 }, y)),
      !w)
    )
      return null;
    Object.assign(a, w.params),
      c.push({ params: a, pathname: Jr([l, w.pathname]), pathnameBase: Bb(Jr([l, w.pathnameBase])), route: S }),
      w.pathnameBase !== '/' && (l = Jr([l, w.pathnameBase]));
  }
  return c;
}
function rl(i, r) {
  typeof i == 'string' && (i = { path: i, caseSensitive: !1, end: !0 });
  let [n, o] = Fb(i.path, i.caseSensitive, i.end),
    a = r.match(n);
  if (!a) return null;
  let l = a[0],
    c = l.replace(/(.)\/+$/, '$1'),
    d = a.slice(1);
  return {
    params: o.reduce((g, { paramName: y, isOptional: w }, S) => {
      if (y === '*') {
        let x = d[S] || '';
        c = l.slice(0, l.length - x.length).replace(/(.)\/+$/, '$1');
      }
      const _ = d[S];
      return w && !_ ? (g[y] = void 0) : (g[y] = (_ || '').replace(/%2F/g, '/')), g;
    }, {}),
    pathname: l,
    pathnameBase: c,
    pattern: i,
  };
}
function Fb(i, r = !1, n = !0) {
  ht(
    i === '*' || !i.endsWith('*') || i.endsWith('/*'),
    `Route path "${i}" will be treated as if it were "${i.replace(
      /\*$/,
      '/*'
    )}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${i.replace(
      /\*$/,
      '/*'
    )}".`
  );
  let o = [],
    a =
      '^' +
      i
        .replace(/\/*\*?$/, '')
        .replace(/^\/*/, '/')
        .replace(/[\\.*+^${}|()[\]]/g, '\\$&')
        .replace(
          /\/:([\w-]+)(\?)?/g,
          (c, d, h) => (o.push({ paramName: d, isOptional: h != null }), h ? '/?([^\\/]+)?' : '/([^\\/]+)')
        )
        .replace(/\/([\w-]+)\?(\/|$)/g, '(/$1)?$2');
  return (
    i.endsWith('*')
      ? (o.push({ paramName: '*' }), (a += i === '*' || i === '/*' ? '(.*)$' : '(?:\\/(.+)|\\/*)$'))
      : n
      ? (a += '\\/*$')
      : i !== '' && i !== '/' && (a += '(?:(?=\\/|$))'),
    [new RegExp(a, r ? void 0 : 'i'), o]
  );
}
function $b(i) {
  try {
    return i
      .split('/')
      .map(r => decodeURIComponent(r).replace(/\//g, '%2F'))
      .join('/');
  } catch (r) {
    return (
      ht(
        !1,
        `The URL path "${i}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${r}).`
      ),
      i
    );
  }
}
function xr(i, r) {
  if (r === '/') return i;
  if (!i.toLowerCase().startsWith(r.toLowerCase())) return null;
  let n = r.endsWith('/') ? r.length - 1 : r.length,
    o = i.charAt(n);
  return o && o !== '/' ? null : i.slice(n) || '/';
}
function zb({ basename: i, pathname: r }) {
  return r === '/' ? i : Jr([i, r]);
}
var cS = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  il = i => cS.test(i);
function qb(i, r = '/') {
  let { pathname: n, search: o = '', hash: a = '' } = typeof i == 'string' ? Jn(i) : i,
    l;
  if (n)
    if (il(n)) l = n;
    else {
      if (n.includes('//')) {
        let c = n;
        (n = n.replace(/\/\/+/g, '/')),
          ht(!1, `Pathnames cannot have embedded double slashes - normalizing ${c} -> ${n}`);
      }
      n.startsWith('/') ? (l = Ly(n.substring(1), '/')) : (l = Ly(n, r));
    }
  else l = r;
  return { pathname: l, search: Ub(o), hash: Hb(a) };
}
function Ly(i, r) {
  let n = r.replace(/\/+$/, '').split('/');
  return (
    i.split('/').forEach(a => {
      a === '..' ? n.length > 1 && n.pop() : a !== '.' && n.push(a);
    }),
    n.length > 1 ? n.join('/') : '/'
  );
}
function cc(i, r, n, o) {
  return `Cannot include a '${i}' character in a manually specified \`to.${r}\` field [${JSON.stringify(
    o
  )}].  Please separate it out to the \`to.${n}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
}
function dS(i) {
  return i.filter((r, n) => n === 0 || (r.route.path && r.route.path.length > 0));
}
function dh(i) {
  let r = dS(i);
  return r.map((n, o) => (o === r.length - 1 ? n.pathname : n.pathnameBase));
}
function fh(i, r, n, o = !1) {
  let a;
  typeof i == 'string'
    ? (a = Jn(i))
    : ((a = { ...i }),
      Le(!a.pathname || !a.pathname.includes('?'), cc('?', 'pathname', 'search', a)),
      Le(!a.pathname || !a.pathname.includes('#'), cc('#', 'pathname', 'hash', a)),
      Le(!a.search || !a.search.includes('#'), cc('#', 'search', 'hash', a)));
  let l = i === '' || a.pathname === '',
    c = l ? '/' : a.pathname,
    d;
  if (c == null) d = n;
  else {
    let w = r.length - 1;
    if (!o && c.startsWith('..')) {
      let S = c.split('/');
      for (; S[0] === '..'; ) S.shift(), (w -= 1);
      a.pathname = S.join('/');
    }
    d = w >= 0 ? r[w] : '/';
  }
  let h = qb(a, d),
    g = c && c !== '/' && c.endsWith('/'),
    y = (l || c === '.') && n.endsWith('/');
  return !h.pathname.endsWith('/') && (g || y) && (h.pathname += '/'), h;
}
var Jr = i => i.join('/').replace(/\/\/+/g, '/'),
  Bb = i => i.replace(/\/+$/, '').replace(/^\/*/, '/'),
  Ub = i => (!i || i === '?' ? '' : i.startsWith('?') ? i : '?' + i),
  Hb = i => (!i || i === '#' ? '' : i.startsWith('#') ? i : '#' + i),
  Sa = class {
    constructor(i, r, n, o = !1) {
      (this.status = i),
        (this.statusText = r || ''),
        (this.internal = o),
        n instanceof Error ? ((this.data = n.toString()), (this.error = n)) : (this.data = n);
    }
  };
function wa(i) {
  return (
    i != null &&
    typeof i.status == 'number' &&
    typeof i.statusText == 'string' &&
    typeof i.internal == 'boolean' &&
    'data' in i
  );
}
function Ea(i) {
  return (
    i
      .map(r => r.route.path)
      .filter(Boolean)
      .join('/')
      .replace(/\/\/*/g, '/') || '/'
  );
}
var fS = typeof window < 'u' && typeof window.document < 'u' && typeof window.document.createElement < 'u';
function pS(i, r) {
  let n = i;
  if (typeof n != 'string' || !cS.test(n)) return { absoluteURL: void 0, isExternal: !1, to: n };
  let o = n,
    a = !1;
  if (fS)
    try {
      let l = new URL(window.location.href),
        c = n.startsWith('//') ? new URL(l.protocol + n) : new URL(n),
        d = xr(c.pathname, r);
      c.origin === l.origin && d != null ? (n = d + c.search + c.hash) : (a = !0);
    } catch {
      ht(
        !1,
        `<Link to="${n}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`
      );
    }
  return { absoluteURL: o, isExternal: a, to: n };
}
var Yn = Symbol('Uninstrumented');
function Kb(i, r) {
  let n = {
    lazy: [],
    'lazy.loader': [],
    'lazy.action': [],
    'lazy.middleware': [],
    middleware: [],
    loader: [],
    action: [],
  };
  i.forEach(a =>
    a({
      id: r.id,
      index: r.index,
      path: r.path,
      instrument(l) {
        let c = Object.keys(n);
        for (let d of c) l[d] && n[d].push(l[d]);
      },
    })
  );
  let o = {};
  if (typeof r.lazy == 'function' && n.lazy.length > 0) {
    let a = eo(n.lazy, r.lazy, () => {});
    a && (o.lazy = a);
  }
  if (typeof r.lazy == 'object') {
    let a = r.lazy;
    ['middleware', 'loader', 'action'].forEach(l => {
      let c = a[l],
        d = n[`lazy.${l}`];
      if (typeof c == 'function' && d.length > 0) {
        let h = eo(d, c, () => {});
        h && (o.lazy = Object.assign(o.lazy || {}, { [l]: h }));
      }
    });
  }
  return (
    ['loader', 'action'].forEach(a => {
      let l = r[a];
      if (typeof l == 'function' && n[a].length > 0) {
        let c = l[Yn] ?? l,
          d = eo(n[a], c, (...h) => jy(h[0]));
        d && (a === 'loader' && c.hydrate === !0 && (d.hydrate = !0), (d[Yn] = c), (o[a] = d));
      }
    }),
    r.middleware &&
      r.middleware.length > 0 &&
      n.middleware.length > 0 &&
      (o.middleware = r.middleware.map(a => {
        let l = a[Yn] ?? a,
          c = eo(n.middleware, l, (...d) => jy(d[0]));
        return c ? ((c[Yn] = l), c) : a;
      })),
    o
  );
}
function Vb(i, r) {
  let n = { navigate: [], fetch: [] };
  if (
    (r.forEach(o =>
      o({
        instrument(a) {
          let l = Object.keys(a);
          for (let c of l) a[c] && n[c].push(a[c]);
        },
      })
    ),
    n.navigate.length > 0)
  ) {
    let o = i.navigate[Yn] ?? i.navigate,
      a = eo(n.navigate, o, (...l) => {
        let [c, d] = l;
        return { to: typeof c == 'number' || typeof c == 'string' ? c : c ? rn(c) : '.', ...Dy(i, d ?? {}) };
      });
    a && ((a[Yn] = o), (i.navigate = a));
  }
  if (n.fetch.length > 0) {
    let o = i.fetch[Yn] ?? i.fetch,
      a = eo(n.fetch, o, (...l) => {
        let [c, , d, h] = l;
        return { href: d ?? '.', fetcherKey: c, ...Dy(i, h ?? {}) };
      });
    a && ((a[Yn] = o), (i.fetch = a));
  }
  return i;
}
function eo(i, r, n) {
  return i.length === 0
    ? null
    : async (...o) => {
        let a = await hS(i, n(...o), () => r(...o), i.length - 1);
        if (a.type === 'error') throw a.value;
        return a.value;
      };
}
async function hS(i, r, n, o) {
  let a = i[o],
    l;
  if (a) {
    let c,
      d = async () => (
        c ? console.error('You cannot call instrumented handlers more than once') : (c = hS(i, r, n, o - 1)),
        (l = await c),
        Le(l, 'Expected a result'),
        l.type === 'error' && l.value instanceof Error
          ? { status: 'error', error: l.value }
          : { status: 'success', error: void 0 }
      );
    try {
      await a(d, r);
    } catch (h) {
      console.error('An instrumentation function threw an error:', h);
    }
    c || (await d()), await c;
  } else
    try {
      l = { type: 'success', value: await n() };
    } catch (c) {
      l = { type: 'error', value: c };
    }
  return l || { type: 'error', value: new Error('No result assigned in instrumentation chain.') };
}
function jy(i) {
  let { request: r, context: n, params: o, unstable_pattern: a } = i;
  return { request: Wb(r), params: { ...o }, unstable_pattern: a, context: Gb(n) };
}
function Dy(i, r) {
  return {
    currentUrl: rn(i.state.location),
    ...('formMethod' in r ? { formMethod: r.formMethod } : {}),
    ...('formEncType' in r ? { formEncType: r.formEncType } : {}),
    ...('formData' in r ? { formData: r.formData } : {}),
    ...('body' in r ? { body: r.body } : {}),
  };
}
function Wb(i) {
  return { method: i.method, url: i.url, headers: { get: (...r) => i.headers.get(...r) } };
}
function Gb(i) {
  if (Yb(i)) {
    let r = { ...i };
    return Object.freeze(r), r;
  } else return { get: r => i.get(r) };
}
var Xb = Object.getOwnPropertyNames(Object.prototype).sort().join('\0');
function Yb(i) {
  if (i === null || typeof i != 'object') return !1;
  const r = Object.getPrototypeOf(i);
  return r === Object.prototype || r === null || Object.getOwnPropertyNames(r).sort().join('\0') === Xb;
}
var mS = ['POST', 'PUT', 'PATCH', 'DELETE'],
  Qb = new Set(mS),
  Zb = ['GET', ...mS],
  Jb = new Set(Zb),
  gS = new Set([301, 302, 303, 307, 308]),
  eC = new Set([307, 308]),
  dc = {
    state: 'idle',
    location: void 0,
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
  },
  tC = {
    state: 'idle',
    data: void 0,
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
  },
  na = { state: 'unblocked', proceed: void 0, reset: void 0, location: void 0 },
  rC = i => ({ hasErrorBoundary: !!i.hasErrorBoundary }),
  yS = 'remix-router-transitions',
  vS = Symbol('ResetLoaderData');
function nC(i) {
  const r = i.window ? i.window : typeof window < 'u' ? window : void 0,
    n = typeof r < 'u' && typeof r.document < 'u' && typeof r.document.createElement < 'u';
  Le(i.routes.length > 0, 'You must provide a non-empty routes array to createRouter');
  let o = i.hydrationRouteProperties || [],
    a = i.mapRouteProperties || rC,
    l = a;
  if (i.unstable_instrumentations) {
    let P = i.unstable_instrumentations;
    l = j => ({ ...a(j), ...Kb(P.map(z => z.route).filter(Boolean), j) });
  }
  let c = {},
    d = va(i.routes, l, void 0, c),
    h,
    g = i.basename || '/';
  g.startsWith('/') || (g = `/${g}`);
  let y = i.dataStrategy || lC,
    w = { ...i.future },
    S = null,
    _ = new Set(),
    x = null,
    T = null,
    O = null,
    L = i.hydrationData != null,
    I = Gn(d, i.history.location, g),
    $ = !1,
    H = null,
    V;
  if (I == null && !i.patchRoutesOnNavigation) {
    let P = Or(404, { pathname: i.history.location.pathname }),
      { matches: j, route: z } = Hs(d);
    (V = !0), (I = j), (H = { [z.id]: P });
  } else if ((I && !i.hydrationData && Vr(I, d, i.history.location.pathname).active && (I = null), I))
    if (I.some(P => P.route.lazy)) V = !1;
    else if (!I.some(P => ph(P.route))) V = !0;
    else {
      let P = i.hydrationData ? i.hydrationData.loaderData : null,
        j = i.hydrationData ? i.hydrationData.errors : null;
      if (j) {
        let z = I.findIndex(Z => j[Z.route.id] !== void 0);
        V = I.slice(0, z + 1).every(Z => !nh(Z.route, P, j));
      } else V = I.every(z => !nh(z.route, P, j));
    }
  else {
    (V = !1), (I = []);
    let P = Vr(null, d, i.history.location.pathname);
    P.active && P.matches && (($ = !0), (I = P.matches));
  }
  let F,
    b = {
      historyAction: i.history.action,
      location: i.history.location,
      matches: I,
      initialized: V,
      navigation: dc,
      restoreScrollPosition: i.hydrationData != null ? !1 : null,
      preventScrollReset: !1,
      revalidation: 'idle',
      loaderData: (i.hydrationData && i.hydrationData.loaderData) || {},
      actionData: (i.hydrationData && i.hydrationData.actionData) || null,
      errors: (i.hydrationData && i.hydrationData.errors) || H,
      fetchers: new Map(),
      blockers: new Map(),
    },
    q = 'POP',
    W = null,
    X = !1,
    G,
    oe = !1,
    ie = new Map(),
    fe = null,
    me = !1,
    be = !1,
    Te = new Set(),
    U = new Map(),
    te = 0,
    ee = -1,
    k = new Map(),
    K = new Set(),
    le = new Map(),
    se = new Map(),
    pe = new Set(),
    Ce = new Map(),
    Ne,
    Re = null;
  function ke() {
    if (
      ((S = i.history.listen(({ action: P, location: j, delta: z }) => {
        if (Ne) {
          Ne(), (Ne = void 0);
          return;
        }
        ht(
          Ce.size === 0 || z != null,
          'You are trying to use a blocker on a POP navigation to a location that was not created by @remix-run/router. This will fail silently in production. This can happen if you are navigating outside the router via `window.history.pushState`/`window.location.hash` instead of using router navigation APIs.  This can also happen if you are using createHashRouter and the user manually changes the URL.'
        );
        let Z = lr({ currentLocation: b.location, nextLocation: j, historyAction: P });
        if (Z && z != null) {
          let ne = new Promise(we => {
            Ne = we;
          });
          i.history.go(z * -1),
            gr(Z, {
              state: 'blocked',
              location: j,
              proceed() {
                gr(Z, { state: 'proceeding', proceed: void 0, reset: void 0, location: j }),
                  ne.then(() => i.history.go(z));
              },
              reset() {
                let we = new Map(b.blockers);
                we.set(Z, na), it({ blockers: we });
              },
            }),
            W?.resolve(),
            (W = null);
          return;
        }
        return Tt(P, j);
      })),
      n)
    ) {
      xC(r, ie);
      let P = () => PC(r, ie);
      r.addEventListener('pagehide', P), (fe = () => r.removeEventListener('pagehide', P));
    }
    return b.initialized || Tt('POP', b.location, { initialHydration: !0 }), F;
  }
  function Ze() {
    S && S(),
      fe && fe(),
      _.clear(),
      G && G.abort(),
      b.fetchers.forEach((P, j) => mr(j)),
      b.blockers.forEach((P, j) => Kr(j));
  }
  function Xt(P) {
    return _.add(P), () => _.delete(P);
  }
  function it(P, j = {}) {
    P.matches &&
      (P.matches = P.matches.map(ne => {
        let we = c[ne.route.id],
          ue = ne.route;
        return ue.element !== we.element ||
          ue.errorElement !== we.errorElement ||
          ue.hydrateFallbackElement !== we.hydrateFallbackElement
          ? { ...ne, route: we }
          : ne;
      })),
      (b = { ...b, ...P });
    let z = [],
      Z = [];
    b.fetchers.forEach((ne, we) => {
      ne.state === 'idle' && (pe.has(we) ? z.push(we) : Z.push(we));
    }),
      pe.forEach(ne => {
        !b.fetchers.has(ne) && !U.has(ne) && z.push(ne);
      }),
      [..._].forEach(ne =>
        ne(b, {
          deletedFetchers: z,
          newErrors: P.errors ?? null,
          viewTransitionOpts: j.viewTransitionOpts,
          flushSync: j.flushSync === !0,
        })
      ),
      z.forEach(ne => mr(ne)),
      Z.forEach(ne => b.fetchers.delete(ne));
  }
  function Bt(P, j, { flushSync: z } = {}) {
    let Z =
        b.actionData != null &&
        b.navigation.formMethod != null &&
        zt(b.navigation.formMethod) &&
        b.navigation.state === 'loading' &&
        P.state?._isRedirect !== !0,
      ne;
    j.actionData
      ? Object.keys(j.actionData).length > 0
        ? (ne = j.actionData)
        : (ne = null)
      : Z
      ? (ne = b.actionData)
      : (ne = null);
    let we = j.loaderData ? Vy(b.loaderData, j.loaderData, j.matches || [], j.errors) : b.loaderData,
      ue = b.blockers;
    ue.size > 0 && ((ue = new Map(ue)), ue.forEach((Pe, Ee) => ue.set(Ee, na)));
    let ye = me ? !1 : bn(P, j.matches || b.matches),
      Se = X === !0 || (b.navigation.formMethod != null && zt(b.navigation.formMethod) && P.state?._isRedirect !== !0);
    h && ((d = h), (h = void 0)),
      me ||
        q === 'POP' ||
        (q === 'PUSH' ? i.history.push(P, P.state) : q === 'REPLACE' && i.history.replace(P, P.state));
    let ve;
    if (q === 'POP') {
      let Pe = ie.get(b.location.pathname);
      Pe && Pe.has(P.pathname)
        ? (ve = { currentLocation: b.location, nextLocation: P })
        : ie.has(P.pathname) && (ve = { currentLocation: P, nextLocation: b.location });
    } else if (oe) {
      let Pe = ie.get(b.location.pathname);
      Pe ? Pe.add(P.pathname) : ((Pe = new Set([P.pathname])), ie.set(b.location.pathname, Pe)),
        (ve = { currentLocation: b.location, nextLocation: P });
    }
    it(
      {
        ...j,
        actionData: ne,
        loaderData: we,
        historyAction: q,
        location: P,
        initialized: !0,
        navigation: dc,
        revalidation: 'idle',
        restoreScrollPosition: ye,
        preventScrollReset: Se,
        blockers: ue,
      },
      { viewTransitionOpts: ve, flushSync: z === !0 }
    ),
      (q = 'POP'),
      (X = !1),
      (oe = !1),
      (me = !1),
      (be = !1),
      W?.resolve(),
      (W = null),
      Re?.resolve(),
      (Re = null);
  }
  async function Ur(P, j) {
    if ((W?.resolve(), (W = null), typeof P == 'number')) {
      W || (W = Yy());
      let Me = W.promise;
      return i.history.go(P), Me;
    }
    let z = rh(b.location, b.matches, g, P, j?.fromRouteId, j?.relative),
      { path: Z, submission: ne, error: we } = My(!1, z, j),
      ue = b.location,
      ye = ya(b.location, Z, j && j.state);
    ye = { ...ye, ...i.history.encodeLocation(ye) };
    let Se = j && j.replace != null ? j.replace : void 0,
      ve = 'PUSH';
    Se === !0
      ? (ve = 'REPLACE')
      : Se === !1 ||
        (ne != null &&
          zt(ne.formMethod) &&
          ne.formAction === b.location.pathname + b.location.search &&
          (ve = 'REPLACE'));
    let Pe = j && 'preventScrollReset' in j ? j.preventScrollReset === !0 : void 0,
      Ee = (j && j.flushSync) === !0,
      $e = lr({ currentLocation: ue, nextLocation: ye, historyAction: ve });
    if ($e) {
      gr($e, {
        state: 'blocked',
        location: ye,
        proceed() {
          gr($e, { state: 'proceeding', proceed: void 0, reset: void 0, location: ye }), Ur(P, j);
        },
        reset() {
          let Me = new Map(b.blockers);
          Me.set($e, na), it({ blockers: Me });
        },
      });
      return;
    }
    await Tt(ve, ye, {
      submission: ne,
      pendingError: we,
      preventScrollReset: Pe,
      replace: j && j.replace,
      enableViewTransition: j && j.viewTransition,
      flushSync: Ee,
      callSiteDefaultShouldRevalidate: j && j.unstable_defaultShouldRevalidate,
    });
  }
  function qe() {
    Re || (Re = Yy()), ar(), it({ revalidation: 'loading' });
    let P = Re.promise;
    return b.navigation.state === 'submitting'
      ? P
      : b.navigation.state === 'idle'
      ? (Tt(b.historyAction, b.location, { startUninterruptedRevalidation: !0 }), P)
      : (Tt(q || b.historyAction, b.navigation.location, {
          overrideNavigation: b.navigation,
          enableViewTransition: oe === !0,
        }),
        P);
  }
  async function Tt(P, j, z) {
    G && G.abort(),
      (G = null),
      (q = P),
      (me = (z && z.startUninterruptedRevalidation) === !0),
      sn(b.location, b.matches),
      (X = (z && z.preventScrollReset) === !0),
      (oe = (z && z.enableViewTransition) === !0);
    let Z = h || d,
      ne = z && z.overrideNavigation,
      we = z?.initialHydration && b.matches && b.matches.length > 0 && !$ ? b.matches : Gn(Z, j, g),
      ue = (z && z.flushSync) === !0;
    if (we && b.initialized && !be && gC(b.location, j) && !(z && z.submission && zt(z.submission.formMethod))) {
      Bt(j, { matches: we }, { flushSync: ue });
      return;
    }
    let ye = Vr(we, Z, j.pathname);
    if ((ye.active && ye.matches && (we = ye.matches), !we)) {
      let { error: ft, notFoundMatches: bt, route: Ke } = Nt(j.pathname);
      Bt(j, { matches: bt, loaderData: {}, errors: { [Ke.id]: ft } }, { flushSync: ue });
      return;
    }
    G = new AbortController();
    let Se = Ji(i.history, j, G.signal, z && z.submission),
      ve = i.getContext ? await i.getContext() : new Ny(),
      Pe;
    if (z && z.pendingError) Pe = [Xn(we).route.id, { type: 'error', error: z.pendingError }];
    else if (z && z.submission && zt(z.submission.formMethod)) {
      let ft = await je(Se, j, z.submission, we, ve, ye.active, z && z.initialHydration === !0, {
        replace: z.replace,
        flushSync: ue,
      });
      if (ft.shortCircuited) return;
      if (ft.pendingActionResult) {
        let [bt, Ke] = ft.pendingActionResult;
        if (hr(Ke) && wa(Ke.error) && Ke.error.status === 404) {
          (G = null), Bt(j, { matches: ft.matches, loaderData: {}, errors: { [bt]: Ke.error } });
          return;
        }
      }
      (we = ft.matches || we),
        (Pe = ft.pendingActionResult),
        (ne = fc(j, z.submission)),
        (ue = !1),
        (ye.active = !1),
        (Se = Ji(i.history, Se.url, Se.signal));
    }
    let {
      shortCircuited: Ee,
      matches: $e,
      loaderData: Me,
      errors: gt,
    } = await or(
      Se,
      j,
      we,
      ve,
      ye.active,
      ne,
      z && z.submission,
      z && z.fetcherSubmission,
      z && z.replace,
      z && z.initialHydration === !0,
      ue,
      Pe,
      z && z.callSiteDefaultShouldRevalidate
    );
    Ee || ((G = null), Bt(j, { matches: $e || we, ...Wy(Pe), loaderData: Me, errors: gt }));
  }
  async function je(P, j, z, Z, ne, we, ue, ye = {}) {
    ar();
    let Se = CC(j, z);
    if ((it({ navigation: Se }, { flushSync: ye.flushSync === !0 }), we)) {
      let Ee = await Cn(Z, j.pathname, P.signal);
      if (Ee.type === 'aborted') return { shortCircuited: !0 };
      if (Ee.type === 'error') {
        if (Ee.partialMatches.length === 0) {
          let { matches: Me, route: gt } = Hs(d);
          return { matches: Me, pendingActionResult: [gt.id, { type: 'error', error: Ee.error }] };
        }
        let $e = Xn(Ee.partialMatches).route.id;
        return { matches: Ee.partialMatches, pendingActionResult: [$e, { type: 'error', error: Ee.error }] };
      } else if (Ee.matches) Z = Ee.matches;
      else {
        let { notFoundMatches: $e, error: Me, route: gt } = Nt(j.pathname);
        return { matches: $e, pendingActionResult: [gt.id, { type: 'error', error: Me }] };
      }
    }
    let ve,
      Pe = Qs(Z, j);
    if (!Pe.route.action && !Pe.route.lazy)
      ve = { type: 'error', error: Or(405, { method: P.method, pathname: j.pathname, routeId: Pe.route.id }) };
    else {
      let Ee = no(l, c, P, Z, Pe, ue ? [] : o, ne),
        $e = await Rt(P, Ee, ne, null);
      if (((ve = $e[Pe.route.id]), !ve)) {
        for (let Me of Z)
          if ($e[Me.route.id]) {
            ve = $e[Me.route.id];
            break;
          }
      }
      if (P.signal.aborted) return { shortCircuited: !0 };
    }
    if (Si(ve)) {
      let Ee;
      return (
        ye && ye.replace != null
          ? (Ee = ye.replace)
          : (Ee =
              Uy(ve.response.headers.get('Location'), new URL(P.url), g, i.history) ===
              b.location.pathname + b.location.search),
        await vt(P, ve, !0, { submission: z, replace: Ee }),
        { shortCircuited: !0 }
      );
    }
    if (hr(ve)) {
      let Ee = Xn(Z, Pe.route.id);
      return (
        (ye && ye.replace) !== !0 && (q = 'PUSH'), { matches: Z, pendingActionResult: [Ee.route.id, ve, Pe.route.id] }
      );
    }
    return { matches: Z, pendingActionResult: [Pe.route.id, ve] };
  }
  async function or(P, j, z, Z, ne, we, ue, ye, Se, ve, Pe, Ee, $e) {
    let Me = we || fc(j, ue),
      gt = ue || ye || Xy(Me),
      ft = !me && !ve;
    if (ne) {
      if (ft) {
        let Xe = Ut(Ee);
        it({ navigation: Me, ...(Xe !== void 0 ? { actionData: Xe } : {}) }, { flushSync: Pe });
      }
      let Fe = await Cn(z, j.pathname, P.signal);
      if (Fe.type === 'aborted') return { shortCircuited: !0 };
      if (Fe.type === 'error') {
        if (Fe.partialMatches.length === 0) {
          let { matches: xn, route: un } = Hs(d);
          return { matches: xn, loaderData: {}, errors: { [un.id]: Fe.error } };
        }
        let Xe = Xn(Fe.partialMatches).route.id;
        return { matches: Fe.partialMatches, loaderData: {}, errors: { [Xe]: Fe.error } };
      } else if (Fe.matches) z = Fe.matches;
      else {
        let { error: Xe, notFoundMatches: xn, route: un } = Nt(j.pathname);
        return { matches: xn, loaderData: {}, errors: { [un.id]: Xe } };
      }
    }
    let bt = h || d,
      { dsMatches: Ke, revalidatingFetchers: Yt } = Fy(
        P,
        Z,
        l,
        c,
        i.history,
        b,
        z,
        gt,
        j,
        ve ? [] : o,
        ve === !0,
        be,
        Te,
        pe,
        le,
        K,
        bt,
        g,
        i.patchRoutesOnNavigation != null,
        Ee,
        $e
      );
    if (
      ((ee = ++te),
      !i.dataStrategy &&
        !Ke.some(Fe => Fe.shouldLoad) &&
        !Ke.some(Fe => Fe.route.middleware && Fe.route.middleware.length > 0) &&
        Yt.length === 0)
    ) {
      let Fe = Ir();
      return (
        Bt(
          j,
          {
            matches: z,
            loaderData: {},
            errors: Ee && hr(Ee[1]) ? { [Ee[0]]: Ee[1].error } : null,
            ...Wy(Ee),
            ...(Fe ? { fetchers: new Map(b.fetchers) } : {}),
          },
          { flushSync: Pe }
        ),
        { shortCircuited: !0 }
      );
    }
    if (ft) {
      let Fe = {};
      if (!ne) {
        Fe.navigation = Me;
        let Xe = Ut(Ee);
        Xe !== void 0 && (Fe.actionData = Xe);
      }
      Yt.length > 0 && (Fe.fetchers = St(Yt)), it(Fe, { flushSync: Pe });
    }
    Yt.forEach(Fe => {
      at(Fe.key), Fe.controller && U.set(Fe.key, Fe.controller);
    });
    let Ve = () => Yt.forEach(Fe => at(Fe.key));
    G && G.signal.addEventListener('abort', Ve);
    let { loaderResults: ni, fetcherResults: vr } = await Hr(Ke, Yt, P, Z);
    if (P.signal.aborted) return { shortCircuited: !0 };
    G && G.signal.removeEventListener('abort', Ve), Yt.forEach(Fe => U.delete(Fe.key));
    let ur = Ks(ni);
    if (ur) return await vt(P, ur.result, !0, { replace: Se }), { shortCircuited: !0 };
    if (((ur = Ks(vr)), ur)) return K.add(ur.key), await vt(P, ur.result, !0, { replace: Se }), { shortCircuited: !0 };
    let { loaderData: On, errors: ii } = Ky(b, z, ni, Ee, Yt, vr);
    ve && b.errors && (ii = { ...b.errors, ...ii });
    let Wr = Ir(),
      ln = Nr(ee),
      Kt = Wr || ln || Yt.length > 0;
    return { matches: z, loaderData: On, errors: ii, ...(Kt ? { fetchers: new Map(b.fetchers) } : {}) };
  }
  function Ut(P) {
    if (P && !hr(P[1])) return { [P[0]]: P[1].data };
    if (b.actionData) return Object.keys(b.actionData).length === 0 ? null : b.actionData;
  }
  function St(P) {
    return (
      P.forEach(j => {
        let z = b.fetchers.get(j.key),
          Z = ia(void 0, z ? z.data : void 0);
        b.fetchers.set(j.key, Z);
      }),
      new Map(b.fetchers)
    );
  }
  async function ct(P, j, z, Z) {
    at(P);
    let ne = (Z && Z.flushSync) === !0,
      we = h || d,
      ue = rh(b.location, b.matches, g, z, j, Z?.relative),
      ye = Gn(we, ue, g),
      Se = Vr(ye, we, ue);
    if ((Se.active && Se.matches && (ye = Se.matches), !ye)) {
      mt(P, j, Or(404, { pathname: ue }), { flushSync: ne });
      return;
    }
    let { path: ve, submission: Pe, error: Ee } = My(!0, ue, Z);
    if (Ee) {
      mt(P, j, Ee, { flushSync: ne });
      return;
    }
    let $e = i.getContext ? await i.getContext() : new Ny(),
      Me = (Z && Z.preventScrollReset) === !0;
    if (Pe && zt(Pe.formMethod)) {
      await Et(P, j, ve, ye, $e, Se.active, ne, Me, Pe, Z && Z.unstable_defaultShouldRevalidate);
      return;
    }
    le.set(P, { routeId: j, path: ve }), await ot(P, j, ve, ye, $e, Se.active, ne, Me, Pe);
  }
  async function Et(P, j, z, Z, ne, we, ue, ye, Se, ve) {
    ar(), le.delete(P);
    let Pe = b.fetchers.get(P);
    Ye(P, OC(Se, Pe), { flushSync: ue });
    let Ee = new AbortController(),
      $e = Ji(i.history, z, Ee.signal, Se);
    if (we) {
      let tt = await Cn(Z, new URL($e.url).pathname, $e.signal, P);
      if (tt.type === 'aborted') return;
      if (tt.type === 'error') {
        mt(P, j, tt.error, { flushSync: ue });
        return;
      } else if (tt.matches) Z = tt.matches;
      else {
        mt(P, j, Or(404, { pathname: z }), { flushSync: ue });
        return;
      }
    }
    let Me = Qs(Z, z);
    if (!Me.route.action && !Me.route.lazy) {
      let tt = Or(405, { method: Se.formMethod, pathname: z, routeId: j });
      mt(P, j, tt, { flushSync: ue });
      return;
    }
    U.set(P, Ee);
    let gt = te,
      ft = no(l, c, $e, Z, Me, o, ne),
      bt = await Rt($e, ft, ne, P),
      Ke = bt[Me.route.id];
    if (!Ke) {
      for (let tt of ft)
        if (bt[tt.route.id]) {
          Ke = bt[tt.route.id];
          break;
        }
    }
    if ($e.signal.aborted) {
      U.get(P) === Ee && U.delete(P);
      return;
    }
    if (pe.has(P)) {
      if (Si(Ke) || hr(Ke)) {
        Ye(P, wn(void 0));
        return;
      }
    } else {
      if (Si(Ke))
        if ((U.delete(P), ee > gt)) {
          Ye(P, wn(void 0));
          return;
        } else return K.add(P), Ye(P, ia(Se)), vt($e, Ke, !1, { fetcherSubmission: Se, preventScrollReset: ye });
      if (hr(Ke)) {
        mt(P, j, Ke.error);
        return;
      }
    }
    let Yt = b.navigation.location || b.location,
      Ve = Ji(i.history, Yt, Ee.signal),
      ni = h || d,
      vr = b.navigation.state !== 'idle' ? Gn(ni, b.navigation.location, g) : b.matches;
    Le(vr, "Didn't find any matches after fetcher action");
    let ur = ++te;
    k.set(P, ur);
    let On = ia(Se, Ke.data);
    b.fetchers.set(P, On);
    let { dsMatches: ii, revalidatingFetchers: Wr } = Fy(
      Ve,
      ne,
      l,
      c,
      i.history,
      b,
      vr,
      Se,
      Yt,
      o,
      !1,
      be,
      Te,
      pe,
      le,
      K,
      ni,
      g,
      i.patchRoutesOnNavigation != null,
      [Me.route.id, Ke],
      ve
    );
    Wr.filter(tt => tt.key !== P).forEach(tt => {
      let cn = tt.key,
        oi = b.fetchers.get(cn),
        ai = ia(void 0, oi ? oi.data : void 0);
      b.fetchers.set(cn, ai), at(cn), tt.controller && U.set(cn, tt.controller);
    }),
      it({ fetchers: new Map(b.fetchers) });
    let ln = () => Wr.forEach(tt => at(tt.key));
    Ee.signal.addEventListener('abort', ln);
    let { loaderResults: Kt, fetcherResults: Fe } = await Hr(ii, Wr, Ve, ne);
    if (Ee.signal.aborted) return;
    if (
      (Ee.signal.removeEventListener('abort', ln),
      k.delete(P),
      U.delete(P),
      Wr.forEach(tt => U.delete(tt.key)),
      b.fetchers.has(P))
    ) {
      let tt = wn(Ke.data);
      b.fetchers.set(P, tt);
    }
    let Xe = Ks(Kt);
    if (Xe) return vt(Ve, Xe.result, !1, { preventScrollReset: ye });
    if (((Xe = Ks(Fe)), Xe)) return K.add(Xe.key), vt(Ve, Xe.result, !1, { preventScrollReset: ye });
    let { loaderData: xn, errors: un } = Ky(b, vr, Kt, void 0, Wr, Fe);
    Nr(ur),
      b.navigation.state === 'loading' && ur > ee
        ? (Le(q, 'Expected pending action'),
          G && G.abort(),
          Bt(b.navigation.location, { matches: vr, loaderData: xn, errors: un, fetchers: new Map(b.fetchers) }))
        : (it({ errors: un, loaderData: Vy(b.loaderData, xn, vr, un), fetchers: new Map(b.fetchers) }), (be = !1));
  }
  async function ot(P, j, z, Z, ne, we, ue, ye, Se) {
    let ve = b.fetchers.get(P);
    Ye(P, ia(Se, ve ? ve.data : void 0), { flushSync: ue });
    let Pe = new AbortController(),
      Ee = Ji(i.history, z, Pe.signal);
    if (we) {
      let Ke = await Cn(Z, new URL(Ee.url).pathname, Ee.signal, P);
      if (Ke.type === 'aborted') return;
      if (Ke.type === 'error') {
        mt(P, j, Ke.error, { flushSync: ue });
        return;
      } else if (Ke.matches) Z = Ke.matches;
      else {
        mt(P, j, Or(404, { pathname: z }), { flushSync: ue });
        return;
      }
    }
    let $e = Qs(Z, z);
    U.set(P, Pe);
    let Me = te,
      gt = no(l, c, Ee, Z, $e, o, ne),
      bt = (await Rt(Ee, gt, ne, P))[$e.route.id];
    if ((U.get(P) === Pe && U.delete(P), !Ee.signal.aborted)) {
      if (pe.has(P)) {
        Ye(P, wn(void 0));
        return;
      }
      if (Si(bt))
        if (ee > Me) {
          Ye(P, wn(void 0));
          return;
        } else {
          K.add(P), await vt(Ee, bt, !1, { preventScrollReset: ye });
          return;
        }
      if (hr(bt)) {
        mt(P, j, bt.error);
        return;
      }
      Ye(P, wn(bt.data));
    }
  }
  async function vt(P, j, z, { submission: Z, fetcherSubmission: ne, preventScrollReset: we, replace: ue } = {}) {
    z || (W?.resolve(), (W = null)), j.response.headers.has('X-Remix-Revalidate') && (be = !0);
    let ye = j.response.headers.get('Location');
    Le(ye, 'Expected a Location header on the redirect Response'), (ye = Uy(ye, new URL(P.url), g, i.history));
    let Se = ya(b.location, ye, { _isRedirect: !0 });
    if (n) {
      let gt = !1;
      if (j.response.headers.has('X-Remix-Reload-Document')) gt = !0;
      else if (il(ye)) {
        const ft = sS(ye, !0);
        gt = ft.origin !== r.location.origin || xr(ft.pathname, g) == null;
      }
      if (gt) {
        ue ? r.location.replace(ye) : r.location.assign(ye);
        return;
      }
    }
    G = null;
    let ve = ue === !0 || j.response.headers.has('X-Remix-Replace') ? 'REPLACE' : 'PUSH',
      { formMethod: Pe, formAction: Ee, formEncType: $e } = b.navigation;
    !Z && !ne && Pe && Ee && $e && (Z = Xy(b.navigation));
    let Me = Z || ne;
    if (eC.has(j.response.status) && Me && zt(Me.formMethod))
      await Tt(ve, Se, {
        submission: { ...Me, formAction: ye },
        preventScrollReset: we || X,
        enableViewTransition: z ? oe : void 0,
      });
    else {
      let gt = fc(Se, Z);
      await Tt(ve, Se, {
        overrideNavigation: gt,
        fetcherSubmission: ne,
        preventScrollReset: we || X,
        enableViewTransition: z ? oe : void 0,
      });
    }
  }
  async function Rt(P, j, z, Z) {
    let ne,
      we = {};
    try {
      ne = await cC(y, P, j, Z, z, !1);
    } catch (ue) {
      return (
        j
          .filter(ye => ye.shouldLoad)
          .forEach(ye => {
            we[ye.route.id] = { type: 'error', error: ue };
          }),
        we
      );
    }
    if (P.signal.aborted) return we;
    if (!zt(P.method))
      for (let ue of j) {
        if (ne[ue.route.id]?.type === 'error') break;
        !ne.hasOwnProperty(ue.route.id) &&
          !b.loaderData.hasOwnProperty(ue.route.id) &&
          (!b.errors || !b.errors.hasOwnProperty(ue.route.id)) &&
          ue.shouldCallHandler() &&
          (ne[ue.route.id] = {
            type: 'error',
            result: new Error(`No result returned from dataStrategy for route ${ue.route.id}`),
          });
      }
    for (let [ue, ye] of Object.entries(ne))
      if (_C(ye)) {
        let Se = ye.result;
        we[ue] = { type: 'redirect', response: hC(Se, P, ue, j, g) };
      } else we[ue] = await pC(ye);
    return we;
  }
  async function Hr(P, j, z, Z) {
    let ne = Rt(z, P, Z, null),
      we = Promise.all(
        j.map(async Se => {
          if (Se.matches && Se.match && Se.request && Se.controller) {
            let Pe = (await Rt(Se.request, Se.matches, Z, Se.key))[Se.match.route.id];
            return { [Se.key]: Pe };
          } else return Promise.resolve({ [Se.key]: { type: 'error', error: Or(404, { pathname: Se.path }) } });
        })
      ),
      ue = await ne,
      ye = (await we).reduce((Se, ve) => Object.assign(Se, ve), {});
    return { loaderResults: ue, fetcherResults: ye };
  }
  function ar() {
    (be = !0),
      le.forEach((P, j) => {
        U.has(j) && Te.add(j), at(j);
      });
  }
  function Ye(P, j, z = {}) {
    b.fetchers.set(P, j), it({ fetchers: new Map(b.fetchers) }, { flushSync: (z && z.flushSync) === !0 });
  }
  function mt(P, j, z, Z = {}) {
    let ne = Xn(b.matches, j);
    mr(P),
      it({ errors: { [ne.route.id]: z }, fetchers: new Map(b.fetchers) }, { flushSync: (Z && Z.flushSync) === !0 });
  }
  function Ht(P) {
    return se.set(P, (se.get(P) || 0) + 1), pe.has(P) && pe.delete(P), b.fetchers.get(P) || tC;
  }
  function sr(P, j) {
    at(P, j?.reason), Ye(P, wn(null));
  }
  function mr(P) {
    let j = b.fetchers.get(P);
    U.has(P) && !(j && j.state === 'loading' && k.has(P)) && at(P),
      le.delete(P),
      k.delete(P),
      K.delete(P),
      pe.delete(P),
      Te.delete(P),
      b.fetchers.delete(P);
  }
  function It(P) {
    let j = (se.get(P) || 0) - 1;
    j <= 0 ? (se.delete(P), pe.add(P)) : se.set(P, j), it({ fetchers: new Map(b.fetchers) });
  }
  function at(P, j) {
    let z = U.get(P);
    z && (z.abort(j), U.delete(P));
  }
  function ti(P) {
    for (let j of P) {
      let z = Ht(j),
        Z = wn(z.data);
      b.fetchers.set(j, Z);
    }
  }
  function Ir() {
    let P = [],
      j = !1;
    for (let z of K) {
      let Z = b.fetchers.get(z);
      Le(Z, `Expected fetcher: ${z}`), Z.state === 'loading' && (K.delete(z), P.push(z), (j = !0));
    }
    return ti(P), j;
  }
  function Nr(P) {
    let j = [];
    for (let [z, Z] of k)
      if (Z < P) {
        let ne = b.fetchers.get(z);
        Le(ne, `Expected fetcher: ${z}`), ne.state === 'loading' && (at(z), k.delete(z), j.push(z));
      }
    return ti(j), j.length > 0;
  }
  function on(P, j) {
    let z = b.blockers.get(P) || na;
    return Ce.get(P) !== j && Ce.set(P, j), z;
  }
  function Kr(P) {
    b.blockers.delete(P), Ce.delete(P);
  }
  function gr(P, j) {
    let z = b.blockers.get(P) || na;
    Le(
      (z.state === 'unblocked' && j.state === 'blocked') ||
        (z.state === 'blocked' && j.state === 'blocked') ||
        (z.state === 'blocked' && j.state === 'proceeding') ||
        (z.state === 'blocked' && j.state === 'unblocked') ||
        (z.state === 'proceeding' && j.state === 'unblocked'),
      `Invalid blocker state transition: ${z.state} -> ${j.state}`
    );
    let Z = new Map(b.blockers);
    Z.set(P, j), it({ blockers: Z });
  }
  function lr({ currentLocation: P, nextLocation: j, historyAction: z }) {
    if (Ce.size === 0) return;
    Ce.size > 1 && ht(!1, 'A router only supports one blocker at a time');
    let Z = Array.from(Ce.entries()),
      [ne, we] = Z[Z.length - 1],
      ue = b.blockers.get(ne);
    if (!(ue && ue.state === 'proceeding') && we({ currentLocation: P, nextLocation: j, historyAction: z })) return ne;
  }
  function Nt(P) {
    let j = Or(404, { pathname: P }),
      z = h || d,
      { matches: Z, route: ne } = Hs(z);
    return { notFoundMatches: Z, route: ne, error: j };
  }
  function an(P, j, z) {
    if (((x = P), (O = j), (T = z || null), !L && b.navigation === dc)) {
      L = !0;
      let Z = bn(b.location, b.matches);
      Z != null && it({ restoreScrollPosition: Z });
    }
    return () => {
      (x = null), (O = null), (T = null);
    };
  }
  function yr(P, j) {
    return (
      (T &&
        T(
          P,
          j.map(Z => Pb(Z, b.loaderData))
        )) ||
      P.key
    );
  }
  function sn(P, j) {
    if (x && O) {
      let z = yr(P, j);
      x[z] = O();
    }
  }
  function bn(P, j) {
    if (x) {
      let z = yr(P, j),
        Z = x[z];
      if (typeof Z == 'number') return Z;
    }
    return null;
  }
  function Vr(P, j, z) {
    if (i.patchRoutesOnNavigation)
      if (P) {
        if (Object.keys(P[0].params).length > 0) return { active: !0, matches: ca(j, z, g, !0) };
      } else return { active: !0, matches: ca(j, z, g, !0) || [] };
    return { active: !1, matches: null };
  }
  async function Cn(P, j, z, Z) {
    if (!i.patchRoutesOnNavigation) return { type: 'success', matches: P };
    let ne = P;
    for (;;) {
      let we = h == null,
        ue = h || d,
        ye = c;
      try {
        await i.patchRoutesOnNavigation({
          signal: z,
          path: j,
          matches: ne,
          fetcherKey: Z,
          patch: (Pe, Ee) => {
            z.aborted || $y(Pe, Ee, ue, ye, l, !1);
          },
        });
      } catch (Pe) {
        return { type: 'error', error: Pe, partialMatches: ne };
      } finally {
        we && !z.aborted && (d = [...d]);
      }
      if (z.aborted) return { type: 'aborted' };
      let Se = Gn(ue, j, g),
        ve = null;
      if (Se) {
        if (Object.keys(Se[0].params).length === 0) return { type: 'success', matches: Se };
        if (((ve = ca(ue, j, g, !0)), !(ve && ne.length < ve.length && Eo(ne, ve.slice(0, ne.length)))))
          return { type: 'success', matches: Se };
      }
      if ((ve || (ve = ca(ue, j, g, !0)), !ve || Eo(ne, ve))) return { type: 'success', matches: null };
      ne = ve;
    }
  }
  function Eo(P, j) {
    return P.length === j.length && P.every((z, Z) => z.route.id === j[Z].route.id);
  }
  function ri(P) {
    (c = {}), (h = va(P, l, void 0, c));
  }
  function bo(P, j, z = !1) {
    let Z = h == null;
    $y(P, j, h || d, c, l, z), Z && ((d = [...d]), it({}));
  }
  return (
    (F = {
      get basename() {
        return g;
      },
      get future() {
        return w;
      },
      get state() {
        return b;
      },
      get routes() {
        return d;
      },
      get window() {
        return r;
      },
      initialize: ke,
      subscribe: Xt,
      enableScrollRestoration: an,
      navigate: Ur,
      fetch: ct,
      revalidate: qe,
      createHref: P => i.history.createHref(P),
      encodeLocation: P => i.history.encodeLocation(P),
      getFetcher: Ht,
      resetFetcher: sr,
      deleteFetcher: It,
      dispose: Ze,
      getBlocker: on,
      deleteBlocker: Kr,
      patchRoutes: bo,
      _internalFetchControllers: U,
      _internalSetRoutes: ri,
      _internalSetStateDoNotUseOrYouWillBreakYourApp(P) {
        it(P);
      },
    }),
    i.unstable_instrumentations && (F = Vb(F, i.unstable_instrumentations.map(P => P.router).filter(Boolean))),
    F
  );
}
function iC(i) {
  return i != null && (('formData' in i && i.formData != null) || ('body' in i && i.body !== void 0));
}
function rh(i, r, n, o, a, l) {
  let c, d;
  if (a) {
    c = [];
    for (let g of r)
      if ((c.push(g), g.route.id === a)) {
        d = g;
        break;
      }
  } else (c = r), (d = r[r.length - 1]);
  let h = fh(o || '.', dh(c), xr(i.pathname, n) || i.pathname, l === 'path');
  if ((o == null && ((h.search = i.search), (h.hash = i.hash)), (o == null || o === '' || o === '.') && d)) {
    let g = mh(h.search);
    if (d.route.index && !g) h.search = h.search ? h.search.replace(/^\?/, '?index&') : '?index';
    else if (!d.route.index && g) {
      let y = new URLSearchParams(h.search),
        w = y.getAll('index');
      y.delete('index'), w.filter(_ => _).forEach(_ => y.append('index', _));
      let S = y.toString();
      h.search = S ? `?${S}` : '';
    }
  }
  return n !== '/' && (h.pathname = zb({ basename: n, pathname: h.pathname })), rn(h);
}
function My(i, r, n) {
  if (!n || !iC(n)) return { path: r };
  if (n.formMethod && !bC(n.formMethod)) return { path: r, error: Or(405, { method: n.formMethod }) };
  let o = () => ({ path: r, error: Or(400, { type: 'invalid-body' }) }),
    l = (n.formMethod || 'get').toUpperCase(),
    c = CS(r);
  if (n.body !== void 0) {
    if (n.formEncType === 'text/plain') {
      if (!zt(l)) return o();
      let w =
        typeof n.body == 'string'
          ? n.body
          : n.body instanceof FormData || n.body instanceof URLSearchParams
          ? Array.from(n.body.entries()).reduce(
              (S, [_, x]) => `${S}${_}=${x}
`,
              ''
            )
          : String(n.body);
      return {
        path: r,
        submission: {
          formMethod: l,
          formAction: c,
          formEncType: n.formEncType,
          formData: void 0,
          json: void 0,
          text: w,
        },
      };
    } else if (n.formEncType === 'application/json') {
      if (!zt(l)) return o();
      try {
        let w = typeof n.body == 'string' ? JSON.parse(n.body) : n.body;
        return {
          path: r,
          submission: {
            formMethod: l,
            formAction: c,
            formEncType: n.formEncType,
            formData: void 0,
            json: w,
            text: void 0,
          },
        };
      } catch {
        return o();
      }
    }
  }
  Le(typeof FormData == 'function', 'FormData is not available in this environment');
  let d, h;
  if (n.formData) (d = oh(n.formData)), (h = n.formData);
  else if (n.body instanceof FormData) (d = oh(n.body)), (h = n.body);
  else if (n.body instanceof URLSearchParams) (d = n.body), (h = Hy(d));
  else if (n.body == null) (d = new URLSearchParams()), (h = new FormData());
  else
    try {
      (d = new URLSearchParams(n.body)), (h = Hy(d));
    } catch {
      return o();
    }
  let g = {
    formMethod: l,
    formAction: c,
    formEncType: (n && n.formEncType) || 'application/x-www-form-urlencoded',
    formData: h,
    json: void 0,
    text: void 0,
  };
  if (zt(g.formMethod)) return { path: r, submission: g };
  let y = Jn(r);
  return i && y.search && mh(y.search) && d.append('index', ''), (y.search = `?${d}`), { path: rn(y), submission: g };
}
function Fy(i, r, n, o, a, l, c, d, h, g, y, w, S, _, x, T, O, L, I, $, H) {
  let V = $ ? (hr($[1]) ? $[1].error : $[1].data) : void 0,
    F = a.createURL(l.location),
    b = a.createURL(h),
    q;
  if (y && l.errors) {
    let me = Object.keys(l.errors)[0];
    q = c.findIndex(be => be.route.id === me);
  } else if ($ && hr($[1])) {
    let me = $[0];
    q = c.findIndex(be => be.route.id === me) - 1;
  }
  let W = $ ? $[1].statusCode : void 0,
    X = W && W >= 400,
    G = {
      currentUrl: F,
      currentParams: l.matches[0]?.params || {},
      nextUrl: b,
      nextParams: c[0].params,
      ...d,
      actionResult: V,
      actionStatus: W,
    },
    oe = Ea(c),
    ie = c.map((me, be) => {
      let { route: Te } = me,
        U = null;
      if (
        (q != null && be > q
          ? (U = !1)
          : Te.lazy
          ? (U = !0)
          : ph(Te)
          ? y
            ? (U = nh(Te, l.loaderData, l.errors))
            : oC(l.loaderData, l.matches[be], me) && (U = !0)
          : (U = !1),
        U !== null)
      )
        return ih(n, o, i, oe, me, g, r, U);
      let te = !1;
      typeof H == 'boolean'
        ? (te = H)
        : X
        ? (te = !1)
        : (w || F.pathname + F.search === b.pathname + b.search || F.search !== b.search || aC(l.matches[be], me)) &&
          (te = !0);
      let ee = { ...G, defaultShouldRevalidate: te },
        k = ma(me, ee);
      return ih(n, o, i, oe, me, g, r, k, ee, H);
    }),
    fe = [];
  return (
    x.forEach((me, be) => {
      if (y || !c.some(se => se.route.id === me.routeId) || _.has(be)) return;
      let Te = l.fetchers.get(be),
        U = Te && Te.state !== 'idle' && Te.data === void 0,
        te = Gn(O, me.path, L);
      if (!te) {
        if (I && U) return;
        fe.push({
          key: be,
          routeId: me.routeId,
          path: me.path,
          matches: null,
          match: null,
          request: null,
          controller: null,
        });
        return;
      }
      if (T.has(be)) return;
      let ee = Qs(te, me.path),
        k = new AbortController(),
        K = Ji(a, me.path, k.signal),
        le = null;
      if (S.has(be)) S.delete(be), (le = no(n, o, K, te, ee, g, r));
      else if (U) w && (le = no(n, o, K, te, ee, g, r));
      else {
        let se;
        typeof H == 'boolean' ? (se = H) : X ? (se = !1) : (se = w);
        let pe = { ...G, defaultShouldRevalidate: se };
        ma(ee, pe) && (le = no(n, o, K, te, ee, g, r, pe));
      }
      le && fe.push({ key: be, routeId: me.routeId, path: me.path, matches: le, match: ee, request: K, controller: k });
    }),
    { dsMatches: ie, revalidatingFetchers: fe }
  );
}
function ph(i) {
  return i.loader != null || (i.middleware != null && i.middleware.length > 0);
}
function nh(i, r, n) {
  if (i.lazy) return !0;
  if (!ph(i)) return !1;
  let o = r != null && i.id in r,
    a = n != null && n[i.id] !== void 0;
  return !o && a ? !1 : typeof i.loader == 'function' && i.loader.hydrate === !0 ? !0 : !o && !a;
}
function oC(i, r, n) {
  let o = !r || n.route.id !== r.route.id,
    a = !i.hasOwnProperty(n.route.id);
  return o || a;
}
function aC(i, r) {
  let n = i.route.path;
  return i.pathname !== r.pathname || (n != null && n.endsWith('*') && i.params['*'] !== r.params['*']);
}
function ma(i, r) {
  if (i.route.shouldRevalidate) {
    let n = i.route.shouldRevalidate(r);
    if (typeof n == 'boolean') return n;
  }
  return r.defaultShouldRevalidate;
}
function $y(i, r, n, o, a, l) {
  let c;
  if (i) {
    let g = o[i];
    Le(g, `No route found to patch children into: routeId = ${i}`), g.children || (g.children = []), (c = g.children);
  } else c = n;
  let d = [],
    h = [];
  if (
    (r.forEach(g => {
      let y = c.find(w => wS(g, w));
      y ? h.push({ existingRoute: y, newRoute: g }) : d.push(g);
    }),
    d.length > 0)
  ) {
    let g = va(d, a, [i || '_', 'patch', String(c?.length || '0')], o);
    c.push(...g);
  }
  if (l && h.length > 0)
    for (let g = 0; g < h.length; g++) {
      let { existingRoute: y, newRoute: w } = h[g],
        S = y,
        [_] = va([w], a, [], {}, !0);
      Object.assign(S, {
        element: _.element ? _.element : S.element,
        errorElement: _.errorElement ? _.errorElement : S.errorElement,
        hydrateFallbackElement: _.hydrateFallbackElement ? _.hydrateFallbackElement : S.hydrateFallbackElement,
      });
    }
}
function wS(i, r) {
  return 'id' in i && 'id' in r && i.id === r.id
    ? !0
    : i.index === r.index && i.path === r.path && i.caseSensitive === r.caseSensitive
    ? (!i.children || i.children.length === 0) && (!r.children || r.children.length === 0)
      ? !0
      : i.children.every((n, o) => r.children?.some(a => wS(n, a)))
    : !1;
}
var zy = new WeakMap(),
  _S = ({ key: i, route: r, manifest: n, mapRouteProperties: o }) => {
    let a = n[r.id];
    if ((Le(a, 'No route found in manifest'), !a.lazy || typeof a.lazy != 'object')) return;
    let l = a.lazy[i];
    if (!l) return;
    let c = zy.get(a);
    c || ((c = {}), zy.set(a, c));
    let d = c[i];
    if (d) return d;
    let h = (async () => {
      let g = bb(i),
        w = a[i] !== void 0 && i !== 'hasErrorBoundary';
      if (g)
        ht(!g, 'Route property ' + i + ' is not a supported lazy route property. This property will be ignored.'),
          (c[i] = Promise.resolve());
      else if (w) ht(!1, `Route "${a.id}" has a static property "${i}" defined. The lazy property will be ignored.`);
      else {
        let S = await l();
        S != null && (Object.assign(a, { [i]: S }), Object.assign(a, o(a)));
      }
      typeof a.lazy == 'object' &&
        ((a.lazy[i] = void 0), Object.values(a.lazy).every(S => S === void 0) && (a.lazy = void 0));
    })();
    return (c[i] = h), h;
  },
  qy = new WeakMap();
function sC(i, r, n, o, a) {
  let l = n[i.id];
  if ((Le(l, 'No route found in manifest'), !i.lazy)) return { lazyRoutePromise: void 0, lazyHandlerPromise: void 0 };
  if (typeof i.lazy == 'function') {
    let y = qy.get(l);
    if (y) return { lazyRoutePromise: y, lazyHandlerPromise: y };
    let w = (async () => {
      Le(typeof i.lazy == 'function', 'No lazy route function found');
      let S = await i.lazy(),
        _ = {};
      for (let x in S) {
        let T = S[x];
        if (T === void 0) continue;
        let O = Ob(x),
          I = l[x] !== void 0 && x !== 'hasErrorBoundary';
        O
          ? ht(
              !O,
              'Route property ' +
                x +
                ' is not a supported property to be returned from a lazy route function. This property will be ignored.'
            )
          : I
          ? ht(
              !I,
              `Route "${l.id}" has a static property "${x}" defined but its lazy function is also returning a value for this property. The lazy route property "${x}" will be ignored.`
            )
          : (_[x] = T);
      }
      Object.assign(l, _), Object.assign(l, { ...o(l), lazy: void 0 });
    })();
    return qy.set(l, w), w.catch(() => {}), { lazyRoutePromise: w, lazyHandlerPromise: w };
  }
  let c = Object.keys(i.lazy),
    d = [],
    h;
  for (let y of c) {
    if (a && a.includes(y)) continue;
    let w = _S({ key: y, route: i, manifest: n, mapRouteProperties: o });
    w && (d.push(w), y === r && (h = w));
  }
  let g = d.length > 0 ? Promise.all(d).then(() => {}) : void 0;
  return g?.catch(() => {}), h?.catch(() => {}), { lazyRoutePromise: g, lazyHandlerPromise: h };
}
async function By(i) {
  let r = i.matches.filter(a => a.shouldLoad),
    n = {};
  return (
    (await Promise.all(r.map(a => a.resolve()))).forEach((a, l) => {
      n[r[l].route.id] = a;
    }),
    n
  );
}
async function lC(i) {
  return i.matches.some(r => r.route.middleware) ? SS(i, () => By(i)) : By(i);
}
function SS(i, r) {
  return uC(
    i,
    r,
    o => {
      if (EC(o)) throw o;
      return o;
    },
    vC,
    n
  );
  function n(o, a, l) {
    if (l) return Promise.resolve(Object.assign(l.value, { [a]: { type: 'error', result: o } }));
    {
      let { matches: c } = i,
        d = Math.min(
          Math.max(
            c.findIndex(g => g.route.id === a),
            0
          ),
          Math.max(
            c.findIndex(g => g.shouldCallHandler()),
            0
          )
        ),
        h = Xn(c, c[d].route.id).route.id;
      return Promise.resolve({ [h]: { type: 'error', result: o } });
    }
  }
}
async function uC(i, r, n, o, a) {
  let { matches: l, request: c, params: d, context: h, unstable_pattern: g } = i,
    y = l.flatMap(S => (S.route.middleware ? S.route.middleware.map(_ => [S.route.id, _]) : []));
  return await ES({ request: c, params: d, context: h, unstable_pattern: g }, y, r, n, o, a);
}
async function ES(i, r, n, o, a, l, c = 0) {
  let { request: d } = i;
  if (d.signal.aborted) throw d.signal.reason ?? new Error(`Request aborted: ${d.method} ${d.url}`);
  let h = r[c];
  if (!h) return await n();
  let [g, y] = h,
    w,
    S = async () => {
      if (w) throw new Error('You may only call `next()` once per middleware');
      try {
        return (w = { value: await ES(i, r, n, o, a, l, c + 1) }), w.value;
      } catch (_) {
        return (w = { value: await l(_, g, w) }), w.value;
      }
    };
  try {
    let _ = await y(i, S),
      x = _ != null ? o(_) : void 0;
    return a(x) ? x : w ? x ?? w.value : ((w = { value: await S() }), w.value);
  } catch (_) {
    return await l(_, g, w);
  }
}
function bS(i, r, n, o, a) {
  let l = _S({ key: 'middleware', route: o.route, manifest: r, mapRouteProperties: i }),
    c = sC(o.route, zt(n.method) ? 'action' : 'loader', r, i, a);
  return { middleware: l, route: c.lazyRoutePromise, handler: c.lazyHandlerPromise };
}
function ih(i, r, n, o, a, l, c, d, h = null, g) {
  let y = !1,
    w = bS(i, r, n, a, l);
  return {
    ...a,
    _lazyPromises: w,
    shouldLoad: d,
    shouldRevalidateArgs: h,
    shouldCallHandler(S) {
      return (
        (y = !0),
        h
          ? typeof g == 'boolean'
            ? ma(a, { ...h, defaultShouldRevalidate: g })
            : typeof S == 'boolean'
            ? ma(a, { ...h, defaultShouldRevalidate: S })
            : ma(a, h)
          : d
      );
    },
    resolve(S) {
      let { lazy: _, loader: x, middleware: T } = a.route,
        O = y || d || (S && !zt(n.method) && (_ || x)),
        L = T && T.length > 0 && !x && !_;
      return O && (zt(n.method) || !L)
        ? dC({
            request: n,
            unstable_pattern: o,
            match: a,
            lazyHandlerPromise: w?.handler,
            lazyRoutePromise: w?.route,
            handlerOverride: S,
            scopedContext: c,
          })
        : Promise.resolve({ type: 'data', result: void 0 });
    },
  };
}
function no(i, r, n, o, a, l, c, d = null) {
  return o.map(h =>
    h.route.id !== a.route.id
      ? {
          ...h,
          shouldLoad: !1,
          shouldRevalidateArgs: d,
          shouldCallHandler: () => !1,
          _lazyPromises: bS(i, r, n, h, l),
          resolve: () => Promise.resolve({ type: 'data', result: void 0 }),
        }
      : ih(i, r, n, Ea(o), h, l, c, !0, d)
  );
}
async function cC(i, r, n, o, a, l) {
  n.some(g => g._lazyPromises?.middleware) && (await Promise.all(n.map(g => g._lazyPromises?.middleware)));
  let c = { request: r, unstable_pattern: Ea(n), params: n[0].params, context: a, matches: n },
    h = await i({
      ...c,
      fetcherKey: o,
      runClientMiddleware: g => {
        let y = c;
        return SS(y, () =>
          g({
            ...y,
            fetcherKey: o,
            runClientMiddleware: () => {
              throw new Error('Cannot call `runClientMiddleware()` from within an `runClientMiddleware` handler');
            },
          })
        );
      },
    });
  try {
    await Promise.all(n.flatMap(g => [g._lazyPromises?.handler, g._lazyPromises?.route]));
  } catch {}
  return h;
}
async function dC({
  request: i,
  unstable_pattern: r,
  match: n,
  lazyHandlerPromise: o,
  lazyRoutePromise: a,
  handlerOverride: l,
  scopedContext: c,
}) {
  let d,
    h,
    g = zt(i.method),
    y = g ? 'action' : 'loader',
    w = S => {
      let _,
        x = new Promise((L, I) => (_ = I));
      (h = () => _()), i.signal.addEventListener('abort', h);
      let T = L =>
          typeof S != 'function'
            ? Promise.reject(
                new Error(
                  `You cannot call the handler for a route which defines a boolean "${y}" [routeId: ${n.route.id}]`
                )
              )
            : S({ request: i, unstable_pattern: r, params: n.params, context: c }, ...(L !== void 0 ? [L] : [])),
        O = (async () => {
          try {
            return { type: 'data', result: await (l ? l(I => T(I)) : T()) };
          } catch (L) {
            return { type: 'error', result: L };
          }
        })();
      return Promise.race([O, x]);
    };
  try {
    let S = g ? n.route.action : n.route.loader;
    if (o || a)
      if (S) {
        let _,
          [x] = await Promise.all([
            w(S).catch(T => {
              _ = T;
            }),
            o,
            a,
          ]);
        if (_ !== void 0) throw _;
        d = x;
      } else {
        await o;
        let _ = g ? n.route.action : n.route.loader;
        if (_) [d] = await Promise.all([w(_), a]);
        else if (y === 'action') {
          let x = new URL(i.url),
            T = x.pathname + x.search;
          throw Or(405, { method: i.method, pathname: T, routeId: n.route.id });
        } else return { type: 'data', result: void 0 };
      }
    else if (S) d = await w(S);
    else {
      let _ = new URL(i.url),
        x = _.pathname + _.search;
      throw Or(404, { pathname: x });
    }
  } catch (S) {
    return { type: 'error', result: S };
  } finally {
    h && i.signal.removeEventListener('abort', h);
  }
  return d;
}
async function fC(i) {
  let r = i.headers.get('Content-Type');
  return r && /\bapplication\/json\b/.test(r) ? (i.body == null ? null : i.json()) : i.text();
}
async function pC(i) {
  let { result: r, type: n } = i;
  if (hh(r)) {
    let o;
    try {
      o = await fC(r);
    } catch (a) {
      return { type: 'error', error: a };
    }
    return n === 'error'
      ? { type: 'error', error: new Sa(r.status, r.statusText, o), statusCode: r.status, headers: r.headers }
      : { type: 'data', data: o, statusCode: r.status, headers: r.headers };
  }
  return n === 'error'
    ? Gy(r)
      ? r.data instanceof Error
        ? {
            type: 'error',
            error: r.data,
            statusCode: r.init?.status,
            headers: r.init?.headers ? new Headers(r.init.headers) : void 0,
          }
        : {
            type: 'error',
            error: yC(r),
            statusCode: wa(r) ? r.status : void 0,
            headers: r.init?.headers ? new Headers(r.init.headers) : void 0,
          }
      : { type: 'error', error: r, statusCode: wa(r) ? r.status : void 0 }
    : Gy(r)
    ? {
        type: 'data',
        data: r.data,
        statusCode: r.init?.status,
        headers: r.init?.headers ? new Headers(r.init.headers) : void 0,
      }
    : { type: 'data', data: r };
}
function hC(i, r, n, o, a) {
  let l = i.headers.get('Location');
  if ((Le(l, 'Redirects returned/thrown from loaders/actions must have a Location header'), !il(l))) {
    let c = o.slice(0, o.findIndex(d => d.route.id === n) + 1);
    (l = rh(new URL(r.url), c, a, l)), i.headers.set('Location', l);
  }
  return i;
}
function Uy(i, r, n, o) {
  let a = [
    'about:',
    'blob:',
    'chrome:',
    'chrome-untrusted:',
    'content:',
    'data:',
    'devtools:',
    'file:',
    'filesystem:',
    'javascript:',
  ];
  if (il(i)) {
    let l = i,
      c = l.startsWith('//') ? new URL(r.protocol + l) : new URL(l);
    if (a.includes(c.protocol)) throw new Error('Invalid redirect location');
    let d = xr(c.pathname, n) != null;
    if (c.origin === r.origin && d) return c.pathname + c.search + c.hash;
  }
  try {
    let l = o.createURL(i);
    if (a.includes(l.protocol)) throw new Error('Invalid redirect location');
  } catch {}
  return i;
}
function Ji(i, r, n, o) {
  let a = i.createURL(CS(r)).toString(),
    l = { signal: n };
  if (o && zt(o.formMethod)) {
    let { formMethod: c, formEncType: d } = o;
    (l.method = c.toUpperCase()),
      d === 'application/json'
        ? ((l.headers = new Headers({ 'Content-Type': d })), (l.body = JSON.stringify(o.json)))
        : d === 'text/plain'
        ? (l.body = o.text)
        : d === 'application/x-www-form-urlencoded' && o.formData
        ? (l.body = oh(o.formData))
        : (l.body = o.formData);
  }
  return new Request(a, l);
}
function oh(i) {
  let r = new URLSearchParams();
  for (let [n, o] of i.entries()) r.append(n, typeof o == 'string' ? o : o.name);
  return r;
}
function Hy(i) {
  let r = new FormData();
  for (let [n, o] of i.entries()) r.append(n, o);
  return r;
}
function mC(i, r, n, o = !1, a = !1) {
  let l = {},
    c = null,
    d,
    h = !1,
    g = {},
    y = n && hr(n[1]) ? n[1].error : void 0;
  return (
    i.forEach(w => {
      if (!(w.route.id in r)) return;
      let S = w.route.id,
        _ = r[S];
      if ((Le(!Si(_), 'Cannot handle redirect results in processLoaderData'), hr(_))) {
        let x = _.error;
        if ((y !== void 0 && ((x = y), (y = void 0)), (c = c || {}), a)) c[S] = x;
        else {
          let T = Xn(i, S);
          c[T.route.id] == null && (c[T.route.id] = x);
        }
        o || (l[S] = vS), h || ((h = !0), (d = wa(_.error) ? _.error.status : 500)), _.headers && (g[S] = _.headers);
      } else
        (l[S] = _.data),
          _.statusCode && _.statusCode !== 200 && !h && (d = _.statusCode),
          _.headers && (g[S] = _.headers);
    }),
    y !== void 0 && n && ((c = { [n[0]]: y }), n[2] && (l[n[2]] = void 0)),
    { loaderData: l, errors: c, statusCode: d || 200, loaderHeaders: g }
  );
}
function Ky(i, r, n, o, a, l) {
  let { loaderData: c, errors: d } = mC(r, n, o);
  return (
    a
      .filter(h => !h.matches || h.matches.some(g => g.shouldLoad))
      .forEach(h => {
        let { key: g, match: y, controller: w } = h;
        if (w && w.signal.aborted) return;
        let S = l[g];
        if ((Le(S, 'Did not find corresponding fetcher result'), hr(S))) {
          let _ = Xn(i.matches, y?.route.id);
          (d && d[_.route.id]) || (d = { ...d, [_.route.id]: S.error }), i.fetchers.delete(g);
        } else if (Si(S)) Le(!1, 'Unhandled fetcher revalidation redirect');
        else {
          let _ = wn(S.data);
          i.fetchers.set(g, _);
        }
      }),
    { loaderData: c, errors: d }
  );
}
function Vy(i, r, n, o) {
  let a = Object.entries(r)
    .filter(([, l]) => l !== vS)
    .reduce((l, [c, d]) => ((l[c] = d), l), {});
  for (let l of n) {
    let c = l.route.id;
    if ((!r.hasOwnProperty(c) && i.hasOwnProperty(c) && l.route.loader && (a[c] = i[c]), o && o.hasOwnProperty(c)))
      break;
  }
  return a;
}
function Wy(i) {
  return i ? (hr(i[1]) ? { actionData: {} } : { actionData: { [i[0]]: i[1].data } }) : {};
}
function Xn(i, r) {
  return (
    (r ? i.slice(0, i.findIndex(o => o.route.id === r) + 1) : [...i])
      .reverse()
      .find(o => o.route.hasErrorBoundary === !0) || i[0]
  );
}
function Hs(i) {
  let r = i.length === 1 ? i[0] : i.find(n => n.index || !n.path || n.path === '/') || { id: '__shim-error-route__' };
  return { matches: [{ params: {}, pathname: '', pathnameBase: '', route: r }], route: r };
}
function Or(i, { pathname: r, routeId: n, method: o, type: a, message: l } = {}) {
  let c = 'Unknown Server Error',
    d = 'Unknown @remix-run/router error';
  return (
    i === 400
      ? ((c = 'Bad Request'),
        o && r && n
          ? (d = `You made a ${o} request to "${r}" but did not provide a \`loader\` for route "${n}", so there is no way to handle the request.`)
          : a === 'invalid-body' && (d = 'Unable to encode submission body'))
      : i === 403
      ? ((c = 'Forbidden'), (d = `Route "${n}" does not match URL "${r}"`))
      : i === 404
      ? ((c = 'Not Found'), (d = `No route matches URL "${r}"`))
      : i === 405 &&
        ((c = 'Method Not Allowed'),
        o && r && n
          ? (d = `You made a ${o.toUpperCase()} request to "${r}" but did not provide an \`action\` for route "${n}", so there is no way to handle the request.`)
          : o && (d = `Invalid request method "${o.toUpperCase()}"`)),
    new Sa(i || 500, c, new Error(d), !0)
  );
}
function Ks(i) {
  let r = Object.entries(i);
  for (let n = r.length - 1; n >= 0; n--) {
    let [o, a] = r[n];
    if (Si(a)) return { key: o, result: a };
  }
}
function CS(i) {
  let r = typeof i == 'string' ? Jn(i) : i;
  return rn({ ...r, hash: '' });
}
function gC(i, r) {
  return i.pathname !== r.pathname || i.search !== r.search
    ? !1
    : i.hash === ''
    ? r.hash !== ''
    : i.hash === r.hash
    ? !0
    : r.hash !== '';
}
function yC(i) {
  return new Sa(i.init?.status ?? 500, i.init?.statusText ?? 'Internal Server Error', i.data);
}
function vC(i) {
  return i != null && typeof i == 'object' && Object.entries(i).every(([r, n]) => typeof r == 'string' && wC(n));
}
function wC(i) {
  return i != null && typeof i == 'object' && 'type' in i && 'result' in i && (i.type === 'data' || i.type === 'error');
}
function _C(i) {
  return hh(i.result) && gS.has(i.result.status);
}
function hr(i) {
  return i.type === 'error';
}
function Si(i) {
  return (i && i.type) === 'redirect';
}
function Gy(i) {
  return (
    typeof i == 'object' && i != null && 'type' in i && 'data' in i && 'init' in i && i.type === 'DataWithResponseInit'
  );
}
function hh(i) {
  return (
    i != null &&
    typeof i.status == 'number' &&
    typeof i.statusText == 'string' &&
    typeof i.headers == 'object' &&
    typeof i.body < 'u'
  );
}
function SC(i) {
  return gS.has(i);
}
function EC(i) {
  return hh(i) && SC(i.status) && i.headers.has('Location');
}
function bC(i) {
  return Jb.has(i.toUpperCase());
}
function zt(i) {
  return Qb.has(i.toUpperCase());
}
function mh(i) {
  return new URLSearchParams(i).getAll('index').some(r => r === '');
}
function Qs(i, r) {
  let n = typeof r == 'string' ? Jn(r).search : r.search;
  if (i[i.length - 1].route.index && mh(n || '')) return i[i.length - 1];
  let o = dS(i);
  return o[o.length - 1];
}
function Xy(i) {
  let { formMethod: r, formAction: n, formEncType: o, text: a, formData: l, json: c } = i;
  if (!(!r || !n || !o)) {
    if (a != null) return { formMethod: r, formAction: n, formEncType: o, formData: void 0, json: void 0, text: a };
    if (l != null) return { formMethod: r, formAction: n, formEncType: o, formData: l, json: void 0, text: void 0 };
    if (c !== void 0) return { formMethod: r, formAction: n, formEncType: o, formData: void 0, json: c, text: void 0 };
  }
}
function fc(i, r) {
  return r
    ? {
        state: 'loading',
        location: i,
        formMethod: r.formMethod,
        formAction: r.formAction,
        formEncType: r.formEncType,
        formData: r.formData,
        json: r.json,
        text: r.text,
      }
    : {
        state: 'loading',
        location: i,
        formMethod: void 0,
        formAction: void 0,
        formEncType: void 0,
        formData: void 0,
        json: void 0,
        text: void 0,
      };
}
function CC(i, r) {
  return {
    state: 'submitting',
    location: i,
    formMethod: r.formMethod,
    formAction: r.formAction,
    formEncType: r.formEncType,
    formData: r.formData,
    json: r.json,
    text: r.text,
  };
}
function ia(i, r) {
  return i
    ? {
        state: 'loading',
        formMethod: i.formMethod,
        formAction: i.formAction,
        formEncType: i.formEncType,
        formData: i.formData,
        json: i.json,
        text: i.text,
        data: r,
      }
    : {
        state: 'loading',
        formMethod: void 0,
        formAction: void 0,
        formEncType: void 0,
        formData: void 0,
        json: void 0,
        text: void 0,
        data: r,
      };
}
function OC(i, r) {
  return {
    state: 'submitting',
    formMethod: i.formMethod,
    formAction: i.formAction,
    formEncType: i.formEncType,
    formData: i.formData,
    json: i.json,
    text: i.text,
    data: r ? r.data : void 0,
  };
}
function wn(i) {
  return {
    state: 'idle',
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
    data: i,
  };
}
function xC(i, r) {
  try {
    let n = i.sessionStorage.getItem(yS);
    if (n) {
      let o = JSON.parse(n);
      for (let [a, l] of Object.entries(o || {})) l && Array.isArray(l) && r.set(a, new Set(l || []));
    }
  } catch {}
}
function PC(i, r) {
  if (r.size > 0) {
    let n = {};
    for (let [o, a] of r) n[o] = [...a];
    try {
      i.sessionStorage.setItem(yS, JSON.stringify(n));
    } catch (o) {
      ht(!1, `Failed to save applied view transitions in sessionStorage (${o}).`);
    }
  }
}
function Yy() {
  let i,
    r,
    n = new Promise((o, a) => {
      (i = async l => {
        o(l);
        try {
          await n;
        } catch {}
      }),
        (r = async l => {
          a(l);
          try {
            await n;
          } catch {}
        });
    });
  return { promise: n, resolve: i, reject: r };
}
var Ci = A.createContext(null);
Ci.displayName = 'DataRouter';
var ba = A.createContext(null);
ba.displayName = 'DataRouterState';
var OS = A.createContext(!1);
function TC() {
  return A.useContext(OS);
}
var gh = A.createContext({ isTransitioning: !1 });
gh.displayName = 'ViewTransition';
var xS = A.createContext(new Map());
xS.displayName = 'Fetchers';
var RC = A.createContext(null);
RC.displayName = 'Await';
var Pr = A.createContext(null);
Pr.displayName = 'Navigation';
var ol = A.createContext(null);
ol.displayName = 'Location';
var En = A.createContext({ outlet: null, matches: [], isDataRoute: !1 });
En.displayName = 'Route';
var yh = A.createContext(null);
yh.displayName = 'RouteError';
var PS = 'REACT_ROUTER_ERROR',
  IC = 'REDIRECT',
  NC = 'ROUTE_ERROR_RESPONSE';
function kC(i) {
  if (i.startsWith(`${PS}:${IC}:{`))
    try {
      let r = JSON.parse(i.slice(28));
      if (
        typeof r == 'object' &&
        r &&
        typeof r.status == 'number' &&
        typeof r.statusText == 'string' &&
        typeof r.location == 'string' &&
        typeof r.reloadDocument == 'boolean' &&
        typeof r.replace == 'boolean'
      )
        return r;
    } catch {}
}
function AC(i) {
  if (i.startsWith(`${PS}:${NC}:{`))
    try {
      let r = JSON.parse(i.slice(40));
      if (typeof r == 'object' && r && typeof r.status == 'number' && typeof r.statusText == 'string')
        return new Sa(r.status, r.statusText, r.data);
    } catch {}
}
function LC(i, { relative: r } = {}) {
  Le(Ca(), 'useHref() may be used only in the context of a <Router> component.');
  let { basename: n, navigator: o } = A.useContext(Pr),
    { hash: a, pathname: l, search: c } = Oa(i, { relative: r }),
    d = l;
  return n !== '/' && (d = l === '/' ? n : Jr([n, l])), o.createHref({ pathname: d, search: c, hash: a });
}
function Ca() {
  return A.useContext(ol) != null;
}
function Oi() {
  return Le(Ca(), 'useLocation() may be used only in the context of a <Router> component.'), A.useContext(ol).location;
}
var TS = 'You should call navigate() in a React.useEffect(), not when your component is first rendered.';
function RS(i) {
  A.useContext(Pr).static || A.useLayoutEffect(i);
}
function jC() {
  let { isDataRoute: i } = A.useContext(En);
  return i ? GC() : DC();
}
function DC() {
  Le(Ca(), 'useNavigate() may be used only in the context of a <Router> component.');
  let i = A.useContext(Ci),
    { basename: r, navigator: n } = A.useContext(Pr),
    { matches: o } = A.useContext(En),
    { pathname: a } = Oi(),
    l = JSON.stringify(dh(o)),
    c = A.useRef(!1);
  return (
    RS(() => {
      c.current = !0;
    }),
    A.useCallback(
      (h, g = {}) => {
        if ((ht(c.current, TS), !c.current)) return;
        if (typeof h == 'number') {
          n.go(h);
          return;
        }
        let y = fh(h, JSON.parse(l), a, g.relative === 'path');
        i == null && r !== '/' && (y.pathname = y.pathname === '/' ? r : Jr([r, y.pathname])),
          (g.replace ? n.replace : n.push)(y, g.state, g);
      },
      [r, n, l, a, i]
    )
  );
}
A.createContext(null);
function Oa(i, { relative: r } = {}) {
  let { matches: n } = A.useContext(En),
    { pathname: o } = Oi(),
    a = JSON.stringify(dh(n));
  return A.useMemo(() => fh(i, JSON.parse(a), o, r === 'path'), [i, a, o, r]);
}
function MC(i, r, n, o, a) {
  Le(Ca(), 'useRoutes() may be used only in the context of a <Router> component.');
  let { navigator: l } = A.useContext(Pr),
    { matches: c } = A.useContext(En),
    d = c[c.length - 1],
    h = d ? d.params : {},
    g = d ? d.pathname : '/',
    y = d ? d.pathnameBase : '/',
    w = d && d.route;
  {
    let I = (w && w.path) || '';
    NS(
      g,
      !w || I.endsWith('*') || I.endsWith('*?'),
      `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${g}" (under <Route path="${I}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${I}"> to <Route path="${I === '/' ? '*' : `${I}/*`}">.`
    );
  }
  let S = Oi(),
    _;
  _ = S;
  let x = _.pathname || '/',
    T = x;
  if (y !== '/') {
    let I = y.replace(/^\//, '').split('/');
    T = '/' + x.replace(/^\//, '').split('/').slice(I.length).join('/');
  }
  let O = Gn(i, { pathname: T });
  return (
    ht(w || O != null, `No routes matched location "${_.pathname}${_.search}${_.hash}" `),
    ht(
      O == null ||
        O[O.length - 1].route.element !== void 0 ||
        O[O.length - 1].route.Component !== void 0 ||
        O[O.length - 1].route.lazy !== void 0,
      `Matched leaf route at location "${_.pathname}${_.search}${_.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`
    ),
    BC(
      O &&
        O.map(I =>
          Object.assign({}, I, {
            params: Object.assign({}, h, I.params),
            pathname: Jr([
              y,
              l.encodeLocation
                ? l.encodeLocation(I.pathname.replace(/\?/g, '%3F').replace(/#/g, '%23')).pathname
                : I.pathname,
            ]),
            pathnameBase:
              I.pathnameBase === '/'
                ? y
                : Jr([
                    y,
                    l.encodeLocation
                      ? l.encodeLocation(I.pathnameBase.replace(/\?/g, '%3F').replace(/#/g, '%23')).pathname
                      : I.pathnameBase,
                  ]),
          })
        ),
      c,
      n,
      o,
      a
    )
  );
}
function FC() {
  let i = WC(),
    r = wa(i) ? `${i.status} ${i.statusText}` : i instanceof Error ? i.message : JSON.stringify(i),
    n = i instanceof Error ? i.stack : null,
    o = 'rgba(200,200,200, 0.5)',
    a = { padding: '0.5rem', backgroundColor: o },
    l = { padding: '2px 4px', backgroundColor: o },
    c = null;
  return (
    console.error('Error handled by React Router default ErrorBoundary:', i),
    (c = A.createElement(
      A.Fragment,
      null,
      A.createElement('p', null, '💿 Hey developer 👋'),
      A.createElement(
        'p',
        null,
        'You can provide a way better UX than this when your app throws errors by providing your own ',
        A.createElement('code', { style: l }, 'ErrorBoundary'),
        ' or',
        ' ',
        A.createElement('code', { style: l }, 'errorElement'),
        ' prop on your route.'
      )
    )),
    A.createElement(
      A.Fragment,
      null,
      A.createElement('h2', null, 'Unexpected Application Error!'),
      A.createElement('h3', { style: { fontStyle: 'italic' } }, r),
      n ? A.createElement('pre', { style: a }, n) : null,
      c
    )
  );
}
var $C = A.createElement(FC, null),
  IS = class extends A.Component {
    constructor(i) {
      super(i), (this.state = { location: i.location, revalidation: i.revalidation, error: i.error });
    }
    static getDerivedStateFromError(i) {
      return { error: i };
    }
    static getDerivedStateFromProps(i, r) {
      return r.location !== i.location || (r.revalidation !== 'idle' && i.revalidation === 'idle')
        ? { error: i.error, location: i.location, revalidation: i.revalidation }
        : {
            error: i.error !== void 0 ? i.error : r.error,
            location: r.location,
            revalidation: i.revalidation || r.revalidation,
          };
    }
    componentDidCatch(i, r) {
      this.props.onError
        ? this.props.onError(i, r)
        : console.error('React Router caught the following error during render', i);
    }
    render() {
      let i = this.state.error;
      if (this.context && typeof i == 'object' && i && 'digest' in i && typeof i.digest == 'string') {
        const n = AC(i.digest);
        n && (i = n);
      }
      let r =
        i !== void 0
          ? A.createElement(
              En.Provider,
              { value: this.props.routeContext },
              A.createElement(yh.Provider, { value: i, children: this.props.component })
            )
          : this.props.children;
      return this.context ? A.createElement(zC, { error: i }, r) : r;
    }
  };
IS.contextType = OS;
var pc = new WeakMap();
function zC({ children: i, error: r }) {
  let { basename: n } = A.useContext(Pr);
  if (typeof r == 'object' && r && 'digest' in r && typeof r.digest == 'string') {
    let o = kC(r.digest);
    if (o) {
      let a = pc.get(r);
      if (a) throw a;
      let l = pS(o.location, n);
      if (fS && !pc.get(r))
        if (l.isExternal || o.reloadDocument) window.location.href = l.absoluteURL || l.to;
        else {
          const c = Promise.resolve().then(() => window.__reactRouterDataRouter.navigate(l.to, { replace: o.replace }));
          throw (pc.set(r, c), c);
        }
      return A.createElement('meta', { httpEquiv: 'refresh', content: `0;url=${l.absoluteURL || l.to}` });
    }
  }
  return i;
}
function qC({ routeContext: i, match: r, children: n }) {
  let o = A.useContext(Ci);
  return (
    o &&
      o.static &&
      o.staticContext &&
      (r.route.errorElement || r.route.ErrorBoundary) &&
      (o.staticContext._deepestRenderedBoundaryId = r.route.id),
    A.createElement(En.Provider, { value: i }, n)
  );
}
function BC(i, r = [], n = null, o = null, a = null) {
  if (i == null) {
    if (!n) return null;
    if (n.errors) i = n.matches;
    else if (r.length === 0 && !n.initialized && n.matches.length > 0) i = n.matches;
    else return null;
  }
  let l = i,
    c = n?.errors;
  if (c != null) {
    let y = l.findIndex(w => w.route.id && c?.[w.route.id] !== void 0);
    Le(y >= 0, `Could not find a matching route for errors on route IDs: ${Object.keys(c).join(',')}`),
      (l = l.slice(0, Math.min(l.length, y + 1)));
  }
  let d = !1,
    h = -1;
  if (n)
    for (let y = 0; y < l.length; y++) {
      let w = l[y];
      if (((w.route.HydrateFallback || w.route.hydrateFallbackElement) && (h = y), w.route.id)) {
        let { loaderData: S, errors: _ } = n,
          x = w.route.loader && !S.hasOwnProperty(w.route.id) && (!_ || _[w.route.id] === void 0);
        if (w.route.lazy || x) {
          (d = !0), h >= 0 ? (l = l.slice(0, h + 1)) : (l = [l[0]]);
          break;
        }
      }
    }
  let g =
    n && o
      ? (y, w) => {
          o(y, {
            location: n.location,
            params: n.matches?.[0]?.params ?? {},
            unstable_pattern: Ea(n.matches),
            errorInfo: w,
          });
        }
      : void 0;
  return l.reduceRight((y, w, S) => {
    let _,
      x = !1,
      T = null,
      O = null;
    n &&
      ((_ = c && w.route.id ? c[w.route.id] : void 0),
      (T = w.route.errorElement || $C),
      d &&
        (h < 0 && S === 0
          ? (NS('route-fallback', !1, 'No `HydrateFallback` element provided to render during initial hydration'),
            (x = !0),
            (O = null))
          : h === S && ((x = !0), (O = w.route.hydrateFallbackElement || null))));
    let L = r.concat(l.slice(0, S + 1)),
      I = () => {
        let $;
        return (
          _
            ? ($ = T)
            : x
            ? ($ = O)
            : w.route.Component
            ? ($ = A.createElement(w.route.Component, null))
            : w.route.element
            ? ($ = w.route.element)
            : ($ = y),
          A.createElement(qC, {
            match: w,
            routeContext: { outlet: y, matches: L, isDataRoute: n != null },
            children: $,
          })
        );
      };
    return n && (w.route.ErrorBoundary || w.route.errorElement || S === 0)
      ? A.createElement(IS, {
          location: n.location,
          revalidation: n.revalidation,
          component: T,
          error: _,
          children: I(),
          routeContext: { outlet: null, matches: L, isDataRoute: !0 },
          onError: g,
        })
      : I();
  }, null);
}
function vh(i) {
  return `${i} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function UC(i) {
  let r = A.useContext(Ci);
  return Le(r, vh(i)), r;
}
function HC(i) {
  let r = A.useContext(ba);
  return Le(r, vh(i)), r;
}
function KC(i) {
  let r = A.useContext(En);
  return Le(r, vh(i)), r;
}
function wh(i) {
  let r = KC(i),
    n = r.matches[r.matches.length - 1];
  return Le(n.route.id, `${i} can only be used on routes that contain a unique "id"`), n.route.id;
}
function VC() {
  return wh('useRouteId');
}
function WC() {
  let i = A.useContext(yh),
    r = HC('useRouteError'),
    n = wh('useRouteError');
  return i !== void 0 ? i : r.errors?.[n];
}
function GC() {
  let { router: i } = UC('useNavigate'),
    r = wh('useNavigate'),
    n = A.useRef(!1);
  return (
    RS(() => {
      n.current = !0;
    }),
    A.useCallback(
      async (a, l = {}) => {
        ht(n.current, TS),
          n.current && (typeof a == 'number' ? await i.navigate(a) : await i.navigate(a, { fromRouteId: r, ...l }));
      },
      [i, r]
    )
  );
}
var Qy = {};
function NS(i, r, n) {
  !r && !Qy[i] && ((Qy[i] = !0), ht(!1, n));
}
var Zy = {};
function Jy(i, r) {
  !i && !Zy[r] && ((Zy[r] = !0), console.warn(r));
}
var XC = 'useOptimistic',
  ev = db[XC],
  YC = () => {};
function QC(i) {
  return ev ? ev(i) : [i, YC];
}
function ZC(i) {
  let r = { hasErrorBoundary: i.hasErrorBoundary || i.ErrorBoundary != null || i.errorElement != null };
  return (
    i.Component &&
      (i.element &&
        ht(!1, 'You should not include both `Component` and `element` on your route - `Component` will be used.'),
      Object.assign(r, { element: A.createElement(i.Component), Component: void 0 })),
    i.HydrateFallback &&
      (i.hydrateFallbackElement &&
        ht(
          !1,
          'You should not include both `HydrateFallback` and `hydrateFallbackElement` on your route - `HydrateFallback` will be used.'
        ),
      Object.assign(r, { hydrateFallbackElement: A.createElement(i.HydrateFallback), HydrateFallback: void 0 })),
    i.ErrorBoundary &&
      (i.errorElement &&
        ht(
          !1,
          'You should not include both `ErrorBoundary` and `errorElement` on your route - `ErrorBoundary` will be used.'
        ),
      Object.assign(r, { errorElement: A.createElement(i.ErrorBoundary), ErrorBoundary: void 0 })),
    r
  );
}
var JC = ['HydrateFallback', 'hydrateFallbackElement'],
  eO = class {
    constructor() {
      (this.status = 'pending'),
        (this.promise = new Promise((i, r) => {
          (this.resolve = n => {
            this.status === 'pending' && ((this.status = 'resolved'), i(n));
          }),
            (this.reject = n => {
              this.status === 'pending' && ((this.status = 'rejected'), r(n));
            });
        }));
    }
  };
function tO({ router: i, flushSync: r, onError: n, unstable_useTransitions: o }) {
  o = TC() || o;
  let [l, c] = A.useState(i.state),
    [d, h] = QC(l),
    [g, y] = A.useState(),
    [w, S] = A.useState({ isTransitioning: !1 }),
    [_, x] = A.useState(),
    [T, O] = A.useState(),
    [L, I] = A.useState(),
    $ = A.useRef(new Map()),
    H = A.useCallback(
      (q, { deletedFetchers: W, newErrors: X, flushSync: G, viewTransitionOpts: oe }) => {
        X &&
          n &&
          Object.values(X).forEach(fe =>
            n(fe, { location: q.location, params: q.matches[0]?.params ?? {}, unstable_pattern: Ea(q.matches) })
          ),
          q.fetchers.forEach((fe, me) => {
            fe.data !== void 0 && $.current.set(me, fe.data);
          }),
          W.forEach(fe => $.current.delete(fe)),
          Jy(
            G === !1 || r != null,
            'You provided the `flushSync` option to a router update, but you are not using the `<RouterProvider>` from `react-router/dom` so `ReactDOM.flushSync()` is unavailable.  Please update your app to `import { RouterProvider } from "react-router/dom"` and ensure you have `react-dom` installed as a dependency to use the `flushSync` option.'
          );
        let ie =
          i.window != null && i.window.document != null && typeof i.window.document.startViewTransition == 'function';
        if (
          (Jy(
            oe == null || ie,
            'You provided the `viewTransition` option to a router update, but you do not appear to be running in a DOM environment as `window.startViewTransition` is not available.'
          ),
          !oe || !ie)
        ) {
          r && G
            ? r(() => c(q))
            : o === !1
            ? c(q)
            : A.startTransition(() => {
                o === !0 && h(fe => tv(fe, q)), c(q);
              });
          return;
        }
        if (r && G) {
          r(() => {
            T && (_?.resolve(), T.skipTransition()),
              S({
                isTransitioning: !0,
                flushSync: !0,
                currentLocation: oe.currentLocation,
                nextLocation: oe.nextLocation,
              });
          });
          let fe = i.window.document.startViewTransition(() => {
            r(() => c(q));
          });
          fe.finished.finally(() => {
            r(() => {
              x(void 0), O(void 0), y(void 0), S({ isTransitioning: !1 });
            });
          }),
            r(() => O(fe));
          return;
        }
        T
          ? (_?.resolve(),
            T.skipTransition(),
            I({ state: q, currentLocation: oe.currentLocation, nextLocation: oe.nextLocation }))
          : (y(q),
            S({
              isTransitioning: !0,
              flushSync: !1,
              currentLocation: oe.currentLocation,
              nextLocation: oe.nextLocation,
            }));
      },
      [i.window, r, T, _, o, h, n]
    );
  A.useLayoutEffect(() => i.subscribe(H), [i, H]),
    A.useEffect(() => {
      w.isTransitioning && !w.flushSync && x(new eO());
    }, [w]),
    A.useEffect(() => {
      if (_ && g && i.window) {
        let q = g,
          W = _.promise,
          X = i.window.document.startViewTransition(async () => {
            o === !1
              ? c(q)
              : A.startTransition(() => {
                  o === !0 && h(G => tv(G, q)), c(q);
                }),
              await W;
          });
        X.finished.finally(() => {
          x(void 0), O(void 0), y(void 0), S({ isTransitioning: !1 });
        }),
          O(X);
      }
    }, [g, _, i.window, o, h]),
    A.useEffect(() => {
      _ && g && d.location.key === g.location.key && _.resolve();
    }, [_, T, d.location, g]),
    A.useEffect(() => {
      !w.isTransitioning &&
        L &&
        (y(L.state),
        S({ isTransitioning: !0, flushSync: !1, currentLocation: L.currentLocation, nextLocation: L.nextLocation }),
        I(void 0));
    }, [w.isTransitioning, L]);
  let V = A.useMemo(
      () => ({
        createHref: i.createHref,
        encodeLocation: i.encodeLocation,
        go: q => i.navigate(q),
        push: (q, W, X) => i.navigate(q, { state: W, preventScrollReset: X?.preventScrollReset }),
        replace: (q, W, X) => i.navigate(q, { replace: !0, state: W, preventScrollReset: X?.preventScrollReset }),
      }),
      [i]
    ),
    F = i.basename || '/',
    b = A.useMemo(() => ({ router: i, navigator: V, static: !1, basename: F, onError: n }), [i, V, F, n]);
  return A.createElement(
    A.Fragment,
    null,
    A.createElement(
      Ci.Provider,
      { value: b },
      A.createElement(
        ba.Provider,
        { value: d },
        A.createElement(
          xS.Provider,
          { value: $.current },
          A.createElement(
            gh.Provider,
            { value: w },
            A.createElement(
              iO,
              {
                basename: F,
                location: d.location,
                navigationType: d.historyAction,
                navigator: V,
                unstable_useTransitions: o,
              },
              A.createElement(rO, { routes: i.routes, future: i.future, state: d, onError: n })
            )
          )
        )
      )
    ),
    null
  );
}
function tv(i, r) {
  return {
    ...i,
    navigation: r.navigation.state !== 'idle' ? r.navigation : i.navigation,
    revalidation: r.revalidation !== 'idle' ? r.revalidation : i.revalidation,
    actionData: r.navigation.state !== 'submitting' ? r.actionData : i.actionData,
    fetchers: r.fetchers,
  };
}
var rO = A.memo(nO);
function nO({ routes: i, future: r, state: n, onError: o }) {
  return MC(i, void 0, n, o, r);
}
function iO({
  basename: i = '/',
  children: r = null,
  location: n,
  navigationType: o = 'POP',
  navigator: a,
  static: l = !1,
  unstable_useTransitions: c,
}) {
  Le(!Ca(), 'You cannot render a <Router> inside another <Router>. You should never have more than one in your app.');
  let d = i.replace(/^\/*/, '/'),
    h = A.useMemo(
      () => ({ basename: d, navigator: a, static: l, unstable_useTransitions: c, future: {} }),
      [d, a, l, c]
    );
  typeof n == 'string' && (n = Jn(n));
  let { pathname: g = '/', search: y = '', hash: w = '', state: S = null, key: _ = 'default' } = n,
    x = A.useMemo(() => {
      let T = xr(g, d);
      return T == null ? null : { location: { pathname: T, search: y, hash: w, state: S, key: _ }, navigationType: o };
    }, [d, g, y, w, S, _, o]);
  return (
    ht(
      x != null,
      `<Router basename="${d}"> is not able to match the URL "${g}${y}${w}" because it does not start with the basename, so the <Router> won't render anything.`
    ),
    x == null
      ? null
      : A.createElement(Pr.Provider, { value: h }, A.createElement(ol.Provider, { children: r, value: x }))
  );
}
var Zs = 'get',
  Js = 'application/x-www-form-urlencoded';
function al(i) {
  return typeof HTMLElement < 'u' && i instanceof HTMLElement;
}
function oO(i) {
  return al(i) && i.tagName.toLowerCase() === 'button';
}
function aO(i) {
  return al(i) && i.tagName.toLowerCase() === 'form';
}
function sO(i) {
  return al(i) && i.tagName.toLowerCase() === 'input';
}
function lO(i) {
  return !!(i.metaKey || i.altKey || i.ctrlKey || i.shiftKey);
}
function uO(i, r) {
  return i.button === 0 && (!r || r === '_self') && !lO(i);
}
var Vs = null;
function cO() {
  if (Vs === null)
    try {
      new FormData(document.createElement('form'), 0), (Vs = !1);
    } catch {
      Vs = !0;
    }
  return Vs;
}
var dO = new Set(['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain']);
function hc(i) {
  return i != null && !dO.has(i)
    ? (ht(!1, `"${i}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${Js}"`), null)
    : i;
}
function fO(i, r) {
  let n, o, a, l, c;
  if (aO(i)) {
    let d = i.getAttribute('action');
    (o = d ? xr(d, r) : null),
      (n = i.getAttribute('method') || Zs),
      (a = hc(i.getAttribute('enctype')) || Js),
      (l = new FormData(i));
  } else if (oO(i) || (sO(i) && (i.type === 'submit' || i.type === 'image'))) {
    let d = i.form;
    if (d == null) throw new Error('Cannot submit a <button> or <input type="submit"> without a <form>');
    let h = i.getAttribute('formaction') || d.getAttribute('action');
    if (
      ((o = h ? xr(h, r) : null),
      (n = i.getAttribute('formmethod') || d.getAttribute('method') || Zs),
      (a = hc(i.getAttribute('formenctype')) || hc(d.getAttribute('enctype')) || Js),
      (l = new FormData(d, i)),
      !cO())
    ) {
      let { name: g, type: y, value: w } = i;
      if (y === 'image') {
        let S = g ? `${g}.` : '';
        l.append(`${S}x`, '0'), l.append(`${S}y`, '0');
      } else g && l.append(g, w);
    }
  } else {
    if (al(i)) throw new Error('Cannot submit element that is not <form>, <button>, or <input type="submit|image">');
    (n = Zs), (o = null), (a = Js), (c = i);
  }
  return (
    l && a === 'text/plain' && ((c = l), (l = void 0)),
    { action: o, method: n.toLowerCase(), encType: a, formData: l, body: c }
  );
}
Object.getOwnPropertyNames(Object.prototype).sort().join('\0');
function _h(i, r) {
  if (i === !1 || i === null || typeof i > 'u') throw new Error(r);
}
function pO(i, r, n, o) {
  let a = typeof i == 'string' ? new URL(i, typeof window > 'u' ? 'server://singlefetch/' : window.location.origin) : i;
  return (
    n
      ? a.pathname.endsWith('/')
        ? (a.pathname = `${a.pathname}_.${o}`)
        : (a.pathname = `${a.pathname}.${o}`)
      : a.pathname === '/'
      ? (a.pathname = `_root.${o}`)
      : r && xr(a.pathname, r) === '/'
      ? (a.pathname = `${r.replace(/\/$/, '')}/_root.${o}`)
      : (a.pathname = `${a.pathname.replace(/\/$/, '')}.${o}`),
    a
  );
}
async function hO(i, r) {
  if (i.id in r) return r[i.id];
  try {
    let n = await import(i.module);
    return (r[i.id] = n), n;
  } catch (n) {
    return (
      console.error(`Error loading route module \`${i.module}\`, reloading page...`),
      console.error(n),
      window.__reactRouterContext && window.__reactRouterContext.isSpaMode,
      window.location.reload(),
      new Promise(() => {})
    );
  }
}
function mO(i) {
  return i == null
    ? !1
    : i.href == null
    ? i.rel === 'preload' && typeof i.imageSrcSet == 'string' && typeof i.imageSizes == 'string'
    : typeof i.rel == 'string' && typeof i.href == 'string';
}
async function gO(i, r, n) {
  let o = await Promise.all(
    i.map(async a => {
      let l = r.routes[a.route.id];
      if (l) {
        let c = await hO(l, n);
        return c.links ? c.links() : [];
      }
      return [];
    })
  );
  return _O(
    o
      .flat(1)
      .filter(mO)
      .filter(a => a.rel === 'stylesheet' || a.rel === 'preload')
      .map(a => (a.rel === 'stylesheet' ? { ...a, rel: 'prefetch', as: 'style' } : { ...a, rel: 'prefetch' }))
  );
}
function rv(i, r, n, o, a, l) {
  let c = (h, g) => (n[g] ? h.route.id !== n[g].route.id : !0),
    d = (h, g) =>
      n[g].pathname !== h.pathname || (n[g].route.path?.endsWith('*') && n[g].params['*'] !== h.params['*']);
  return l === 'assets'
    ? r.filter((h, g) => c(h, g) || d(h, g))
    : l === 'data'
    ? r.filter((h, g) => {
        let y = o.routes[h.route.id];
        if (!y || !y.hasLoader) return !1;
        if (c(h, g) || d(h, g)) return !0;
        if (h.route.shouldRevalidate) {
          let w = h.route.shouldRevalidate({
            currentUrl: new URL(a.pathname + a.search + a.hash, window.origin),
            currentParams: n[0]?.params || {},
            nextUrl: new URL(i, window.origin),
            nextParams: h.params,
            defaultShouldRevalidate: !0,
          });
          if (typeof w == 'boolean') return w;
        }
        return !0;
      })
    : [];
}
function yO(i, r, { includeHydrateFallback: n } = {}) {
  return vO(
    i
      .map(o => {
        let a = r.routes[o.route.id];
        if (!a) return [];
        let l = [a.module];
        return (
          a.clientActionModule && (l = l.concat(a.clientActionModule)),
          a.clientLoaderModule && (l = l.concat(a.clientLoaderModule)),
          n && a.hydrateFallbackModule && (l = l.concat(a.hydrateFallbackModule)),
          a.imports && (l = l.concat(a.imports)),
          l
        );
      })
      .flat(1)
  );
}
function vO(i) {
  return [...new Set(i)];
}
function wO(i) {
  let r = {},
    n = Object.keys(i).sort();
  for (let o of n) r[o] = i[o];
  return r;
}
function _O(i, r) {
  let n = new Set();
  return (
    new Set(r),
    i.reduce((o, a) => {
      let l = JSON.stringify(wO(a));
      return n.has(l) || (n.add(l), o.push({ key: l, link: a })), o;
    }, [])
  );
}
function kS() {
  let i = A.useContext(Ci);
  return _h(i, 'You must render this element inside a <DataRouterContext.Provider> element'), i;
}
function SO() {
  let i = A.useContext(ba);
  return _h(i, 'You must render this element inside a <DataRouterStateContext.Provider> element'), i;
}
var Sh = A.createContext(void 0);
Sh.displayName = 'FrameworkContext';
function AS() {
  let i = A.useContext(Sh);
  return _h(i, 'You must render this element inside a <HydratedRouter> element'), i;
}
function EO(i, r) {
  let n = A.useContext(Sh),
    [o, a] = A.useState(!1),
    [l, c] = A.useState(!1),
    { onFocus: d, onBlur: h, onMouseEnter: g, onMouseLeave: y, onTouchStart: w } = r,
    S = A.useRef(null);
  A.useEffect(() => {
    if ((i === 'render' && c(!0), i === 'viewport')) {
      let T = L => {
          L.forEach(I => {
            c(I.isIntersecting);
          });
        },
        O = new IntersectionObserver(T, { threshold: 0.5 });
      return (
        S.current && O.observe(S.current),
        () => {
          O.disconnect();
        }
      );
    }
  }, [i]),
    A.useEffect(() => {
      if (o) {
        let T = setTimeout(() => {
          c(!0);
        }, 100);
        return () => {
          clearTimeout(T);
        };
      }
    }, [o]);
  let _ = () => {
      a(!0);
    },
    x = () => {
      a(!1), c(!1);
    };
  return n
    ? i !== 'intent'
      ? [l, S, {}]
      : [
          l,
          S,
          {
            onFocus: oa(d, _),
            onBlur: oa(h, x),
            onMouseEnter: oa(g, _),
            onMouseLeave: oa(y, x),
            onTouchStart: oa(w, _),
          },
        ]
    : [!1, S, {}];
}
function oa(i, r) {
  return n => {
    i && i(n), n.defaultPrevented || r(n);
  };
}
function bO({ page: i, ...r }) {
  let { router: n } = kS(),
    o = A.useMemo(() => Gn(n.routes, i, n.basename), [n.routes, i, n.basename]);
  return o ? A.createElement(OO, { page: i, matches: o, ...r }) : null;
}
function CO(i) {
  let { manifest: r, routeModules: n } = AS(),
    [o, a] = A.useState([]);
  return (
    A.useEffect(() => {
      let l = !1;
      return (
        gO(i, r, n).then(c => {
          l || a(c);
        }),
        () => {
          l = !0;
        }
      );
    }, [i, r, n]),
    o
  );
}
function OO({ page: i, matches: r, ...n }) {
  let o = Oi(),
    { future: a, manifest: l, routeModules: c } = AS(),
    { basename: d } = kS(),
    { loaderData: h, matches: g } = SO(),
    y = A.useMemo(() => rv(i, r, g, l, o, 'data'), [i, r, g, l, o]),
    w = A.useMemo(() => rv(i, r, g, l, o, 'assets'), [i, r, g, l, o]),
    S = A.useMemo(() => {
      if (i === o.pathname + o.search + o.hash) return [];
      let T = new Set(),
        O = !1;
      if (
        (r.forEach(I => {
          let $ = l.routes[I.route.id];
          !$ ||
            !$.hasLoader ||
            ((!y.some(H => H.route.id === I.route.id) && I.route.id in h && c[I.route.id]?.shouldRevalidate) ||
            $.hasClientLoader
              ? (O = !0)
              : T.add(I.route.id));
        }),
        T.size === 0)
      )
        return [];
      let L = pO(i, d, a.unstable_trailingSlashAwareDataRequests, 'data');
      return (
        O &&
          T.size > 0 &&
          L.searchParams.set(
            '_routes',
            r
              .filter(I => T.has(I.route.id))
              .map(I => I.route.id)
              .join(',')
          ),
        [L.pathname + L.search]
      );
    }, [d, a.unstable_trailingSlashAwareDataRequests, h, o, l, y, r, i, c]),
    _ = A.useMemo(() => yO(w, l), [w, l]),
    x = CO(w);
  return A.createElement(
    A.Fragment,
    null,
    S.map(T => A.createElement('link', { key: T, rel: 'prefetch', as: 'fetch', href: T, ...n })),
    _.map(T => A.createElement('link', { key: T, rel: 'modulepreload', href: T, ...n })),
    x.map(({ key: T, link: O }) => A.createElement('link', { key: T, nonce: n.nonce, ...O }))
  );
}
function xO(...i) {
  return r => {
    i.forEach(n => {
      typeof n == 'function' ? n(r) : n != null && (n.current = r);
    });
  };
}
var PO = typeof window < 'u' && typeof window.document < 'u' && typeof window.document.createElement < 'u';
try {
  PO && (window.__reactRouterVersion = '7.12.0');
} catch {}
function TO(i, r) {
  return nC({
    basename: r?.basename,
    getContext: r?.getContext,
    future: r?.future,
    history: wb({ window: r?.window }),
    hydrationData: RO(),
    routes: i,
    mapRouteProperties: ZC,
    hydrationRouteProperties: JC,
    dataStrategy: r?.dataStrategy,
    patchRoutesOnNavigation: r?.patchRoutesOnNavigation,
    window: r?.window,
    unstable_instrumentations: r?.unstable_instrumentations,
  }).initialize();
}
function RO() {
  let i = window?.__staticRouterHydrationData;
  return i && i.errors && (i = { ...i, errors: IO(i.errors) }), i;
}
function IO(i) {
  if (!i) return null;
  let r = Object.entries(i),
    n = {};
  for (let [o, a] of r)
    if (a && a.__type === 'RouteErrorResponse') n[o] = new Sa(a.status, a.statusText, a.data, a.internal === !0);
    else if (a && a.__type === 'Error') {
      if (a.__subType) {
        let l = window[a.__subType];
        if (typeof l == 'function')
          try {
            let c = new l(a.message);
            (c.stack = ''), (n[o] = c);
          } catch {}
      }
      if (n[o] == null) {
        let l = new Error(a.message);
        (l.stack = ''), (n[o] = l);
      }
    } else n[o] = a;
  return n;
}
var LS = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  jS = A.forwardRef(function (
    {
      onClick: r,
      discover: n = 'render',
      prefetch: o = 'none',
      relative: a,
      reloadDocument: l,
      replace: c,
      state: d,
      target: h,
      to: g,
      preventScrollReset: y,
      viewTransition: w,
      unstable_defaultShouldRevalidate: S,
      ..._
    },
    x
  ) {
    let { basename: T, unstable_useTransitions: O } = A.useContext(Pr),
      L = typeof g == 'string' && LS.test(g),
      I = pS(g, T);
    g = I.to;
    let $ = LC(g, { relative: a }),
      [H, V, F] = EO(o, _),
      b = LO(g, {
        replace: c,
        state: d,
        target: h,
        preventScrollReset: y,
        relative: a,
        viewTransition: w,
        unstable_defaultShouldRevalidate: S,
        unstable_useTransitions: O,
      });
    function q(X) {
      r && r(X), X.defaultPrevented || b(X);
    }
    let W = A.createElement('a', {
      ..._,
      ...F,
      href: I.absoluteURL || $,
      onClick: I.isExternal || l ? r : q,
      ref: xO(x, V),
      target: h,
      'data-discover': !L && n === 'render' ? 'true' : void 0,
    });
    return H && !L ? A.createElement(A.Fragment, null, W, A.createElement(bO, { page: $ })) : W;
  });
jS.displayName = 'Link';
var NO = A.forwardRef(function (
  {
    'aria-current': r = 'page',
    caseSensitive: n = !1,
    className: o = '',
    end: a = !1,
    style: l,
    to: c,
    viewTransition: d,
    children: h,
    ...g
  },
  y
) {
  let w = Oa(c, { relative: g.relative }),
    S = Oi(),
    _ = A.useContext(ba),
    { navigator: x, basename: T } = A.useContext(Pr),
    O = _ != null && $O(w) && d === !0,
    L = x.encodeLocation ? x.encodeLocation(w).pathname : w.pathname,
    I = S.pathname,
    $ = _ && _.navigation && _.navigation.location ? _.navigation.location.pathname : null;
  n || ((I = I.toLowerCase()), ($ = $ ? $.toLowerCase() : null), (L = L.toLowerCase())), $ && T && ($ = xr($, T) || $);
  const H = L !== '/' && L.endsWith('/') ? L.length - 1 : L.length;
  let V = I === L || (!a && I.startsWith(L) && I.charAt(H) === '/'),
    F = $ != null && ($ === L || (!a && $.startsWith(L) && $.charAt(L.length) === '/')),
    b = { isActive: V, isPending: F, isTransitioning: O },
    q = V ? r : void 0,
    W;
  typeof o == 'function'
    ? (W = o(b))
    : (W = [o, V ? 'active' : null, F ? 'pending' : null, O ? 'transitioning' : null].filter(Boolean).join(' '));
  let X = typeof l == 'function' ? l(b) : l;
  return A.createElement(
    jS,
    { ...g, 'aria-current': q, className: W, ref: y, style: X, to: c, viewTransition: d },
    typeof h == 'function' ? h(b) : h
  );
});
NO.displayName = 'NavLink';
var kO = A.forwardRef(
  (
    {
      discover: i = 'render',
      fetcherKey: r,
      navigate: n,
      reloadDocument: o,
      replace: a,
      state: l,
      method: c = Zs,
      action: d,
      onSubmit: h,
      relative: g,
      preventScrollReset: y,
      viewTransition: w,
      unstable_defaultShouldRevalidate: S,
      ..._
    },
    x
  ) => {
    let { unstable_useTransitions: T } = A.useContext(Pr),
      O = MO(),
      L = FO(d, { relative: g }),
      I = c.toLowerCase() === 'get' ? 'get' : 'post',
      $ = typeof d == 'string' && LS.test(d),
      H = V => {
        if ((h && h(V), V.defaultPrevented)) return;
        V.preventDefault();
        let F = V.nativeEvent.submitter,
          b = F?.getAttribute('formmethod') || c,
          q = () =>
            O(F || V.currentTarget, {
              fetcherKey: r,
              method: b,
              navigate: n,
              replace: a,
              state: l,
              relative: g,
              preventScrollReset: y,
              viewTransition: w,
              unstable_defaultShouldRevalidate: S,
            });
        T && n !== !1 ? A.startTransition(() => q()) : q();
      };
    return A.createElement('form', {
      ref: x,
      method: I,
      action: L,
      onSubmit: o ? h : H,
      ..._,
      'data-discover': !$ && i === 'render' ? 'true' : void 0,
    });
  }
);
kO.displayName = 'Form';
function AO(i) {
  return `${i} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function DS(i) {
  let r = A.useContext(Ci);
  return Le(r, AO(i)), r;
}
function LO(
  i,
  {
    target: r,
    replace: n,
    state: o,
    preventScrollReset: a,
    relative: l,
    viewTransition: c,
    unstable_defaultShouldRevalidate: d,
    unstable_useTransitions: h,
  } = {}
) {
  let g = jC(),
    y = Oi(),
    w = Oa(i, { relative: l });
  return A.useCallback(
    S => {
      if (uO(S, r)) {
        S.preventDefault();
        let _ = n !== void 0 ? n : rn(y) === rn(w),
          x = () =>
            g(i, {
              replace: _,
              state: o,
              preventScrollReset: a,
              relative: l,
              viewTransition: c,
              unstable_defaultShouldRevalidate: d,
            });
        h ? A.startTransition(() => x()) : x();
      }
    },
    [y, g, w, n, o, r, i, a, l, c, d, h]
  );
}
var jO = 0,
  DO = () => `__${String(++jO)}__`;
function MO() {
  let { router: i } = DS('useSubmit'),
    { basename: r } = A.useContext(Pr),
    n = VC(),
    o = i.fetch,
    a = i.navigate;
  return A.useCallback(
    async (l, c = {}) => {
      let { action: d, method: h, encType: g, formData: y, body: w } = fO(l, r);
      if (c.navigate === !1) {
        let S = c.fetcherKey || DO();
        await o(S, n, c.action || d, {
          unstable_defaultShouldRevalidate: c.unstable_defaultShouldRevalidate,
          preventScrollReset: c.preventScrollReset,
          formData: y,
          body: w,
          formMethod: c.method || h,
          formEncType: c.encType || g,
          flushSync: c.flushSync,
        });
      } else
        await a(c.action || d, {
          unstable_defaultShouldRevalidate: c.unstable_defaultShouldRevalidate,
          preventScrollReset: c.preventScrollReset,
          formData: y,
          body: w,
          formMethod: c.method || h,
          formEncType: c.encType || g,
          replace: c.replace,
          state: c.state,
          fromRouteId: n,
          flushSync: c.flushSync,
          viewTransition: c.viewTransition,
        });
    },
    [o, a, r, n]
  );
}
function FO(i, { relative: r } = {}) {
  let { basename: n } = A.useContext(Pr),
    o = A.useContext(En);
  Le(o, 'useFormAction must be used inside a RouteContext');
  let [a] = o.matches.slice(-1),
    l = { ...Oa(i || '.', { relative: r }) },
    c = Oi();
  if (i == null) {
    l.search = c.search;
    let d = new URLSearchParams(l.search),
      h = d.getAll('index');
    if (h.some(y => y === '')) {
      d.delete('index'), h.filter(w => w).forEach(w => d.append('index', w));
      let y = d.toString();
      l.search = y ? `?${y}` : '';
    }
  }
  return (
    (!i || i === '.') && a.route.index && (l.search = l.search ? l.search.replace(/^\?/, '?index&') : '?index'),
    n !== '/' && (l.pathname = l.pathname === '/' ? n : Jr([n, l.pathname])),
    rn(l)
  );
}
function $O(i, { relative: r } = {}) {
  let n = A.useContext(gh);
  Le(
    n != null,
    "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?"
  );
  let { basename: o } = DS('useViewTransitionState'),
    a = Oa(i, { relative: r });
  if (!n.isTransitioning) return !1;
  let l = xr(n.currentLocation.pathname, o) || n.currentLocation.pathname,
    c = xr(n.nextLocation.pathname, o) || n.nextLocation.pathname;
  return rl(a.pathname, c) != null || rl(a.pathname, l) != null;
}
var xa = oS();
const mc = ut(xa);
function zO(i) {
  return A.createElement(tO, { flushSync: xa.flushSync, ...i });
}
var gc, nv;
function qO() {
  if (nv) return gc;
  nv = 1;
  function i() {}
  return (gc = i), gc;
}
var BO = qO();
const ze = ut(BO);
var yc, iv;
function ir() {
  if (iv) return yc;
  iv = 1;
  var i = Array.isArray;
  return (yc = i), yc;
}
var vc, ov;
function MS() {
  if (ov) return vc;
  ov = 1;
  var i = typeof Bs == 'object' && Bs && Bs.Object === Object && Bs;
  return (vc = i), vc;
}
var wc, av;
function qr() {
  if (av) return wc;
  av = 1;
  var i = MS(),
    r = typeof self == 'object' && self && self.Object === Object && self,
    n = i || r || Function('return this')();
  return (wc = n), wc;
}
var _c, sv;
function po() {
  if (sv) return _c;
  sv = 1;
  var i = qr(),
    r = i.Symbol;
  return (_c = r), _c;
}
var Sc, lv;
function UO() {
  if (lv) return Sc;
  lv = 1;
  var i = po(),
    r = Object.prototype,
    n = r.hasOwnProperty,
    o = r.toString,
    a = i ? i.toStringTag : void 0;
  function l(c) {
    var d = n.call(c, a),
      h = c[a];
    try {
      c[a] = void 0;
      var g = !0;
    } catch {}
    var y = o.call(c);
    return g && (d ? (c[a] = h) : delete c[a]), y;
  }
  return (Sc = l), Sc;
}
var Ec, uv;
function HO() {
  if (uv) return Ec;
  uv = 1;
  var i = Object.prototype,
    r = i.toString;
  function n(o) {
    return r.call(o);
  }
  return (Ec = n), Ec;
}
var bc, cv;
function ei() {
  if (cv) return bc;
  cv = 1;
  var i = po(),
    r = UO(),
    n = HO(),
    o = '[object Null]',
    a = '[object Undefined]',
    l = i ? i.toStringTag : void 0;
  function c(d) {
    return d == null ? (d === void 0 ? a : o) : l && l in Object(d) ? r(d) : n(d);
  }
  return (bc = c), bc;
}
var Cc, dv;
function Br() {
  if (dv) return Cc;
  dv = 1;
  function i(r) {
    return r != null && typeof r == 'object';
  }
  return (Cc = i), Cc;
}
var Oc, fv;
function sl() {
  if (fv) return Oc;
  fv = 1;
  var i = ei(),
    r = Br(),
    n = '[object Symbol]';
  function o(a) {
    return typeof a == 'symbol' || (r(a) && i(a) == n);
  }
  return (Oc = o), Oc;
}
var xc, pv;
function KO() {
  if (pv) return xc;
  pv = 1;
  var i = ir(),
    r = sl(),
    n = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    o = /^\w*$/;
  function a(l, c) {
    if (i(l)) return !1;
    var d = typeof l;
    return d == 'number' || d == 'symbol' || d == 'boolean' || l == null || r(l)
      ? !0
      : o.test(l) || !n.test(l) || (c != null && l in Object(c));
  }
  return (xc = a), xc;
}
var Pc, hv;
function Tr() {
  if (hv) return Pc;
  hv = 1;
  function i(r) {
    var n = typeof r;
    return r != null && (n == 'object' || n == 'function');
  }
  return (Pc = i), Pc;
}
var Tc, mv;
function ll() {
  if (mv) return Tc;
  mv = 1;
  var i = ei(),
    r = Tr(),
    n = '[object AsyncFunction]',
    o = '[object Function]',
    a = '[object GeneratorFunction]',
    l = '[object Proxy]';
  function c(d) {
    if (!r(d)) return !1;
    var h = i(d);
    return h == o || h == a || h == n || h == l;
  }
  return (Tc = c), Tc;
}
var Rc, gv;
function VO() {
  if (gv) return Rc;
  gv = 1;
  var i = qr(),
    r = i['__core-js_shared__'];
  return (Rc = r), Rc;
}
var Ic, yv;
function WO() {
  if (yv) return Ic;
  yv = 1;
  var i = VO(),
    r = (function () {
      var o = /[^.]+$/.exec((i && i.keys && i.keys.IE_PROTO) || '');
      return o ? 'Symbol(src)_1.' + o : '';
    })();
  function n(o) {
    return !!r && r in o;
  }
  return (Ic = n), Ic;
}
var Nc, vv;
function FS() {
  if (vv) return Nc;
  vv = 1;
  var i = Function.prototype,
    r = i.toString;
  function n(o) {
    if (o != null) {
      try {
        return r.call(o);
      } catch {}
      try {
        return o + '';
      } catch {}
    }
    return '';
  }
  return (Nc = n), Nc;
}
var kc, wv;
function GO() {
  if (wv) return kc;
  wv = 1;
  var i = ll(),
    r = WO(),
    n = Tr(),
    o = FS(),
    a = /[\\^$.*+?()[\]{}|]/g,
    l = /^\[object .+?Constructor\]$/,
    c = Function.prototype,
    d = Object.prototype,
    h = c.toString,
    g = d.hasOwnProperty,
    y = RegExp(
      '^' +
        h
          .call(g)
          .replace(a, '\\$&')
          .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') +
        '$'
    );
  function w(S) {
    if (!n(S) || r(S)) return !1;
    var _ = i(S) ? y : l;
    return _.test(o(S));
  }
  return (kc = w), kc;
}
var Ac, _v;
function XO() {
  if (_v) return Ac;
  _v = 1;
  function i(r, n) {
    return r?.[n];
  }
  return (Ac = i), Ac;
}
var Lc, Sv;
function xi() {
  if (Sv) return Lc;
  Sv = 1;
  var i = GO(),
    r = XO();
  function n(o, a) {
    var l = r(o, a);
    return i(l) ? l : void 0;
  }
  return (Lc = n), Lc;
}
var jc, Ev;
function ul() {
  if (Ev) return jc;
  Ev = 1;
  var i = xi(),
    r = i(Object, 'create');
  return (jc = r), jc;
}
var Dc, bv;
function YO() {
  if (bv) return Dc;
  bv = 1;
  var i = ul();
  function r() {
    (this.__data__ = i ? i(null) : {}), (this.size = 0);
  }
  return (Dc = r), Dc;
}
var Mc, Cv;
function QO() {
  if (Cv) return Mc;
  Cv = 1;
  function i(r) {
    var n = this.has(r) && delete this.__data__[r];
    return (this.size -= n ? 1 : 0), n;
  }
  return (Mc = i), Mc;
}
var Fc, Ov;
function ZO() {
  if (Ov) return Fc;
  Ov = 1;
  var i = ul(),
    r = '__lodash_hash_undefined__',
    n = Object.prototype,
    o = n.hasOwnProperty;
  function a(l) {
    var c = this.__data__;
    if (i) {
      var d = c[l];
      return d === r ? void 0 : d;
    }
    return o.call(c, l) ? c[l] : void 0;
  }
  return (Fc = a), Fc;
}
var $c, xv;
function JO() {
  if (xv) return $c;
  xv = 1;
  var i = ul(),
    r = Object.prototype,
    n = r.hasOwnProperty;
  function o(a) {
    var l = this.__data__;
    return i ? l[a] !== void 0 : n.call(l, a);
  }
  return ($c = o), $c;
}
var zc, Pv;
function ex() {
  if (Pv) return zc;
  Pv = 1;
  var i = ul(),
    r = '__lodash_hash_undefined__';
  function n(o, a) {
    var l = this.__data__;
    return (this.size += this.has(o) ? 0 : 1), (l[o] = i && a === void 0 ? r : a), this;
  }
  return (zc = n), zc;
}
var qc, Tv;
function tx() {
  if (Tv) return qc;
  Tv = 1;
  var i = YO(),
    r = QO(),
    n = ZO(),
    o = JO(),
    a = ex();
  function l(c) {
    var d = -1,
      h = c == null ? 0 : c.length;
    for (this.clear(); ++d < h; ) {
      var g = c[d];
      this.set(g[0], g[1]);
    }
  }
  return (
    (l.prototype.clear = i),
    (l.prototype.delete = r),
    (l.prototype.get = n),
    (l.prototype.has = o),
    (l.prototype.set = a),
    (qc = l),
    qc
  );
}
var Bc, Rv;
function rx() {
  if (Rv) return Bc;
  Rv = 1;
  function i() {
    (this.__data__ = []), (this.size = 0);
  }
  return (Bc = i), Bc;
}
var Uc, Iv;
function Pa() {
  if (Iv) return Uc;
  Iv = 1;
  function i(r, n) {
    return r === n || (r !== r && n !== n);
  }
  return (Uc = i), Uc;
}
var Hc, Nv;
function cl() {
  if (Nv) return Hc;
  Nv = 1;
  var i = Pa();
  function r(n, o) {
    for (var a = n.length; a--; ) if (i(n[a][0], o)) return a;
    return -1;
  }
  return (Hc = r), Hc;
}
var Kc, kv;
function nx() {
  if (kv) return Kc;
  kv = 1;
  var i = cl(),
    r = Array.prototype,
    n = r.splice;
  function o(a) {
    var l = this.__data__,
      c = i(l, a);
    if (c < 0) return !1;
    var d = l.length - 1;
    return c == d ? l.pop() : n.call(l, c, 1), --this.size, !0;
  }
  return (Kc = o), Kc;
}
var Vc, Av;
function ix() {
  if (Av) return Vc;
  Av = 1;
  var i = cl();
  function r(n) {
    var o = this.__data__,
      a = i(o, n);
    return a < 0 ? void 0 : o[a][1];
  }
  return (Vc = r), Vc;
}
var Wc, Lv;
function ox() {
  if (Lv) return Wc;
  Lv = 1;
  var i = cl();
  function r(n) {
    return i(this.__data__, n) > -1;
  }
  return (Wc = r), Wc;
}
var Gc, jv;
function ax() {
  if (jv) return Gc;
  jv = 1;
  var i = cl();
  function r(n, o) {
    var a = this.__data__,
      l = i(a, n);
    return l < 0 ? (++this.size, a.push([n, o])) : (a[l][1] = o), this;
  }
  return (Gc = r), Gc;
}
var Xc, Dv;
function dl() {
  if (Dv) return Xc;
  Dv = 1;
  var i = rx(),
    r = nx(),
    n = ix(),
    o = ox(),
    a = ax();
  function l(c) {
    var d = -1,
      h = c == null ? 0 : c.length;
    for (this.clear(); ++d < h; ) {
      var g = c[d];
      this.set(g[0], g[1]);
    }
  }
  return (
    (l.prototype.clear = i),
    (l.prototype.delete = r),
    (l.prototype.get = n),
    (l.prototype.has = o),
    (l.prototype.set = a),
    (Xc = l),
    Xc
  );
}
var Yc, Mv;
function Eh() {
  if (Mv) return Yc;
  Mv = 1;
  var i = xi(),
    r = qr(),
    n = i(r, 'Map');
  return (Yc = n), Yc;
}
var Qc, Fv;
function sx() {
  if (Fv) return Qc;
  Fv = 1;
  var i = tx(),
    r = dl(),
    n = Eh();
  function o() {
    (this.size = 0), (this.__data__ = { hash: new i(), map: new (n || r)(), string: new i() });
  }
  return (Qc = o), Qc;
}
var Zc, $v;
function lx() {
  if ($v) return Zc;
  $v = 1;
  function i(r) {
    var n = typeof r;
    return n == 'string' || n == 'number' || n == 'symbol' || n == 'boolean' ? r !== '__proto__' : r === null;
  }
  return (Zc = i), Zc;
}
var Jc, zv;
function fl() {
  if (zv) return Jc;
  zv = 1;
  var i = lx();
  function r(n, o) {
    var a = n.__data__;
    return i(o) ? a[typeof o == 'string' ? 'string' : 'hash'] : a.map;
  }
  return (Jc = r), Jc;
}
var ed, qv;
function ux() {
  if (qv) return ed;
  qv = 1;
  var i = fl();
  function r(n) {
    var o = i(this, n).delete(n);
    return (this.size -= o ? 1 : 0), o;
  }
  return (ed = r), ed;
}
var td, Bv;
function cx() {
  if (Bv) return td;
  Bv = 1;
  var i = fl();
  function r(n) {
    return i(this, n).get(n);
  }
  return (td = r), td;
}
var rd, Uv;
function dx() {
  if (Uv) return rd;
  Uv = 1;
  var i = fl();
  function r(n) {
    return i(this, n).has(n);
  }
  return (rd = r), rd;
}
var nd, Hv;
function fx() {
  if (Hv) return nd;
  Hv = 1;
  var i = fl();
  function r(n, o) {
    var a = i(this, n),
      l = a.size;
    return a.set(n, o), (this.size += a.size == l ? 0 : 1), this;
  }
  return (nd = r), nd;
}
var id, Kv;
function bh() {
  if (Kv) return id;
  Kv = 1;
  var i = sx(),
    r = ux(),
    n = cx(),
    o = dx(),
    a = fx();
  function l(c) {
    var d = -1,
      h = c == null ? 0 : c.length;
    for (this.clear(); ++d < h; ) {
      var g = c[d];
      this.set(g[0], g[1]);
    }
  }
  return (
    (l.prototype.clear = i),
    (l.prototype.delete = r),
    (l.prototype.get = n),
    (l.prototype.has = o),
    (l.prototype.set = a),
    (id = l),
    id
  );
}
var od, Vv;
function px() {
  if (Vv) return od;
  Vv = 1;
  var i = bh(),
    r = 'Expected a function';
  function n(o, a) {
    if (typeof o != 'function' || (a != null && typeof a != 'function')) throw new TypeError(r);
    var l = function () {
      var c = arguments,
        d = a ? a.apply(this, c) : c[0],
        h = l.cache;
      if (h.has(d)) return h.get(d);
      var g = o.apply(this, c);
      return (l.cache = h.set(d, g) || h), g;
    };
    return (l.cache = new (n.Cache || i)()), l;
  }
  return (n.Cache = i), (od = n), od;
}
var ad, Wv;
function hx() {
  if (Wv) return ad;
  Wv = 1;
  var i = px(),
    r = 500;
  function n(o) {
    var a = i(o, function (c) {
        return l.size === r && l.clear(), c;
      }),
      l = a.cache;
    return a;
  }
  return (ad = n), ad;
}
var sd, Gv;
function mx() {
  if (Gv) return sd;
  Gv = 1;
  var i = hx(),
    r = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
    n = /\\(\\)?/g,
    o = i(function (a) {
      var l = [];
      return (
        a.charCodeAt(0) === 46 && l.push(''),
        a.replace(r, function (c, d, h, g) {
          l.push(h ? g.replace(n, '$1') : d || c);
        }),
        l
      );
    });
  return (sd = o), sd;
}
var ld, Xv;
function $S() {
  if (Xv) return ld;
  Xv = 1;
  function i(r, n) {
    for (var o = -1, a = r == null ? 0 : r.length, l = Array(a); ++o < a; ) l[o] = n(r[o], o, r);
    return l;
  }
  return (ld = i), ld;
}
var ud, Yv;
function gx() {
  if (Yv) return ud;
  Yv = 1;
  var i = po(),
    r = $S(),
    n = ir(),
    o = sl(),
    a = i ? i.prototype : void 0,
    l = a ? a.toString : void 0;
  function c(d) {
    if (typeof d == 'string') return d;
    if (n(d)) return r(d, c) + '';
    if (o(d)) return l ? l.call(d) : '';
    var h = d + '';
    return h == '0' && 1 / d == -1 / 0 ? '-0' : h;
  }
  return (ud = c), ud;
}
var cd, Qv;
function yx() {
  if (Qv) return cd;
  Qv = 1;
  var i = gx();
  function r(n) {
    return n == null ? '' : i(n);
  }
  return (cd = r), cd;
}
var dd, Zv;
function ho() {
  if (Zv) return dd;
  Zv = 1;
  var i = ir(),
    r = KO(),
    n = mx(),
    o = yx();
  function a(l, c) {
    return i(l) ? l : r(l, c) ? [l] : n(o(l));
  }
  return (dd = a), dd;
}
var fd, Jv;
function pl() {
  if (Jv) return fd;
  Jv = 1;
  var i = sl();
  function r(n) {
    if (typeof n == 'string' || i(n)) return n;
    var o = n + '';
    return o == '0' && 1 / n == -1 / 0 ? '-0' : o;
  }
  return (fd = r), fd;
}
var pd, e0;
function Ch() {
  if (e0) return pd;
  e0 = 1;
  var i = ho(),
    r = pl();
  function n(o, a) {
    a = i(a, o);
    for (var l = 0, c = a.length; o != null && l < c; ) o = o[r(a[l++])];
    return l && l == c ? o : void 0;
  }
  return (pd = n), pd;
}
var hd, t0;
function vx() {
  if (t0) return hd;
  t0 = 1;
  var i = Ch();
  function r(n, o, a) {
    var l = n == null ? void 0 : i(n, o);
    return l === void 0 ? a : l;
  }
  return (hd = r), hd;
}
var wx = vx();
const De = ut(wx),
  zS = function (i) {
    if (De(process, 'env.NODE_ENV') === 'development') {
      for (var r = arguments.length, n = new Array(r > 1 ? r - 1 : 0), o = 1; o < r; o++) n[o - 1] = arguments[o];
      console.log(i, ...n);
    }
  };
class nn {
  static get cssClasses() {
    return {};
  }
  static get strings() {
    return {};
  }
  static get numbers() {
    return {};
  }
  static get defaultAdapter() {
    return {
      getProp: ze,
      getProps: ze,
      getState: ze,
      getStates: ze,
      setState: ze,
      getContext: ze,
      getContexts: ze,
      getCache: ze,
      setCache: ze,
      getCaches: ze,
      stopPropagation: ze,
      persistEvent: ze,
    };
  }
  constructor(r) {
    this._adapter = Object.assign(Object.assign({}, nn.defaultAdapter), r);
  }
  getProp(r) {
    return this._adapter.getProp(r);
  }
  getProps() {
    return this._adapter.getProps();
  }
  getState(r) {
    return this._adapter.getState(r);
  }
  getStates() {
    return this._adapter.getStates();
  }
  setState(r, n) {
    return this._adapter.setState(Object.assign({}, r), n);
  }
  getContext(r) {
    return this._adapter.getContext(r);
  }
  getContexts() {
    return this._adapter.getContexts();
  }
  getCaches() {
    return this._adapter.getCaches();
  }
  getCache(r) {
    return this._adapter.getCache(r);
  }
  setCache(r, n) {
    return r && this._adapter.setCache(r, n);
  }
  stopPropagation(r) {
    this._adapter.stopPropagation(r);
  }
  _isControlledComponent() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'value';
    const n = this.getProps();
    return r in n;
  }
  _isInProps(r) {
    const n = this.getProps();
    return r in n;
  }
  init(r) {}
  destroy() {}
  log(r) {
    for (var n = arguments.length, o = new Array(n > 1 ? n - 1 : 0), a = 1; a < n; a++) o[a - 1] = arguments[a];
    zS(r, ...o);
  }
  _persistEvent(r) {
    this._adapter.persistEvent(r);
  }
}
function qS(i) {
  return Object.keys(i).reduce((r, n) => (n.substr(0, 5) === 'data-' && (r[n] = i[n]), r), {});
}
const { hasOwnProperty: _x } = Object.prototype;
class Rr extends A.Component {
  constructor(r) {
    super(r),
      (this.isControlled = n => !!(n && this.props && typeof this.props == 'object' && _x.call(this.props, n))),
      (this.setStateAsync = n =>
        new Promise(o => {
          this.setState(n, o);
        })),
      (this.cache = {}),
      (this.foundation = null);
  }
  componentDidMount() {
    this.foundation && typeof this.foundation.init == 'function' && this.foundation.init();
  }
  componentWillUnmount() {
    this.foundation && typeof this.foundation.destroy == 'function' && this.foundation.destroy(), (this.cache = {});
  }
  get adapter() {
    return {
      getContext: r => {
        if (this.context && r) return this.context[r];
      },
      getContexts: () => this.context,
      getProp: r => this.props[r],
      getProps: () => this.props,
      getState: r => this.state[r],
      getStates: () => this.state,
      setState: (r, n) => this.setState(Object.assign({}, r), n),
      getCache: r => r && this.cache[r],
      getCaches: () => this.cache,
      setCache: (r, n) => r && (this.cache[r] = n),
      stopPropagation: r => {
        try {
          r.stopPropagation(), r.nativeEvent && r.nativeEvent.stopImmediatePropagation();
        } catch {}
      },
      persistEvent: r => {
        r && r.persist && typeof r.persist == 'function' && r.persist();
      },
    };
  }
  log(r) {
    for (var n = arguments.length, o = new Array(n > 1 ? n - 1 : 0), a = 1; a < n; a++) o[a - 1] = arguments[a];
    return zS(r, ...o);
  }
  getDataAttr() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : this.props;
    return qS(r);
  }
}
Rr.propTypes = {};
Rr.defaultProps = {};
var md, r0;
function Sx() {
  if (r0) return md;
  r0 = 1;
  var i = qr(),
    r = function () {
      return i.Date.now();
    };
  return (md = r), md;
}
var gd, n0;
function Ex() {
  if (n0) return gd;
  n0 = 1;
  var i = /\s/;
  function r(n) {
    for (var o = n.length; o-- && i.test(n.charAt(o)); );
    return o;
  }
  return (gd = r), gd;
}
var yd, i0;
function bx() {
  if (i0) return yd;
  i0 = 1;
  var i = Ex(),
    r = /^\s+/;
  function n(o) {
    return o && o.slice(0, i(o) + 1).replace(r, '');
  }
  return (yd = n), yd;
}
var vd, o0;
function BS() {
  if (o0) return vd;
  o0 = 1;
  var i = bx(),
    r = Tr(),
    n = sl(),
    o = NaN,
    a = /^[-+]0x[0-9a-f]+$/i,
    l = /^0b[01]+$/i,
    c = /^0o[0-7]+$/i,
    d = parseInt;
  function h(g) {
    if (typeof g == 'number') return g;
    if (n(g)) return o;
    if (r(g)) {
      var y = typeof g.valueOf == 'function' ? g.valueOf() : g;
      g = r(y) ? y + '' : y;
    }
    if (typeof g != 'string') return g === 0 ? g : +g;
    g = i(g);
    var w = l.test(g);
    return w || c.test(g) ? d(g.slice(2), w ? 2 : 8) : a.test(g) ? o : +g;
  }
  return (vd = h), vd;
}
var wd, a0;
function Cx() {
  if (a0) return wd;
  a0 = 1;
  var i = Tr(),
    r = Sx(),
    n = BS(),
    o = 'Expected a function',
    a = Math.max,
    l = Math.min;
  function c(d, h, g) {
    var y,
      w,
      S,
      _,
      x,
      T,
      O = 0,
      L = !1,
      I = !1,
      $ = !0;
    if (typeof d != 'function') throw new TypeError(o);
    (h = n(h) || 0),
      i(g) &&
        ((L = !!g.leading),
        (I = 'maxWait' in g),
        (S = I ? a(n(g.maxWait) || 0, h) : S),
        ($ = 'trailing' in g ? !!g.trailing : $));
    function H(ie) {
      var fe = y,
        me = w;
      return (y = w = void 0), (O = ie), (_ = d.apply(me, fe)), _;
    }
    function V(ie) {
      return (O = ie), (x = setTimeout(q, h)), L ? H(ie) : _;
    }
    function F(ie) {
      var fe = ie - T,
        me = ie - O,
        be = h - fe;
      return I ? l(be, S - me) : be;
    }
    function b(ie) {
      var fe = ie - T,
        me = ie - O;
      return T === void 0 || fe >= h || fe < 0 || (I && me >= S);
    }
    function q() {
      var ie = r();
      if (b(ie)) return W(ie);
      x = setTimeout(q, F(ie));
    }
    function W(ie) {
      return (x = void 0), $ && y ? H(ie) : ((y = w = void 0), _);
    }
    function X() {
      x !== void 0 && clearTimeout(x), (O = 0), (y = T = w = x = void 0);
    }
    function G() {
      return x === void 0 ? _ : W(r());
    }
    function oe() {
      var ie = r(),
        fe = b(ie);
      if (((y = arguments), (w = this), (T = ie), fe)) {
        if (x === void 0) return V(T);
        if (I) return clearTimeout(x), (x = setTimeout(q, h)), H(T);
      }
      return x === void 0 && (x = setTimeout(q, h)), _;
    }
    return (oe.cancel = X), (oe.flush = G), oe;
  }
  return (wd = c), wd;
}
var _d, s0;
function Ox() {
  if (s0) return _d;
  s0 = 1;
  var i = Cx(),
    r = Tr(),
    n = 'Expected a function';
  function o(a, l, c) {
    var d = !0,
      h = !0;
    if (typeof a != 'function') throw new TypeError(n);
    return (
      r(c) && ((d = 'leading' in c ? !!c.leading : d), (h = 'trailing' in c ? !!c.trailing : h)),
      i(a, l, { leading: d, maxWait: l, trailing: h })
    );
  }
  return (_d = o), _d;
}
var xx = Ox();
const l0 = ut(xx);
var Sd = { exports: {} };
var u0;
function Px() {
  return (
    u0 ||
      ((u0 = 1),
      (function (i) {
        (function () {
          var r = {}.hasOwnProperty;
          function n() {
            for (var l = '', c = 0; c < arguments.length; c++) {
              var d = arguments[c];
              d && (l = a(l, o(d)));
            }
            return l;
          }
          function o(l) {
            if (typeof l == 'string' || typeof l == 'number') return l;
            if (typeof l != 'object') return '';
            if (Array.isArray(l)) return n.apply(null, l);
            if (l.toString !== Object.prototype.toString && !l.toString.toString().includes('[native code]'))
              return l.toString();
            var c = '';
            for (var d in l) r.call(l, d) && l[d] && (c = a(c, d));
            return c;
          }
          function a(l, c) {
            return c ? (l ? l + ' ' + c : l + c) : l;
          }
          i.exports ? ((n.default = n), (i.exports = n)) : (window.classNames = n);
        })();
      })(Sd)),
    Sd.exports
  );
}
var Tx = Px();
const de = ut(Tx);
var Ed = { exports: {} },
  bd,
  c0;
function Rx() {
  if (c0) return bd;
  c0 = 1;
  var i = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';
  return (bd = i), bd;
}
var Cd, d0;
function Ix() {
  if (d0) return Cd;
  d0 = 1;
  var i = Rx();
  function r() {}
  function n() {}
  return (
    (n.resetWarningCache = r),
    (Cd = function () {
      function o(c, d, h, g, y, w) {
        if (w !== i) {
          var S = new Error(
            'Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types'
          );
          throw ((S.name = 'Invariant Violation'), S);
        }
      }
      o.isRequired = o;
      function a() {
        return o;
      }
      var l = {
        array: o,
        bigint: o,
        bool: o,
        func: o,
        number: o,
        object: o,
        string: o,
        symbol: o,
        any: o,
        arrayOf: a,
        element: o,
        elementType: o,
        instanceOf: a,
        node: o,
        objectOf: a,
        oneOf: a,
        oneOfType: a,
        shape: a,
        exact: a,
        checkPropTypes: n,
        resetWarningCache: r,
      };
      return (l.PropTypes = l), l;
    }),
    Cd
  );
}
var f0;
function Nx() {
  return f0 || ((f0 = 1), (Ed.exports = Ix()())), Ed.exports;
}
var kx = Nx();
const m = ut(kx),
  nr = 'semi';
var Ax = ir();
const Lx = ut(Ax);
var Od, p0;
function jx() {
  if (p0) return Od;
  p0 = 1;
  var i = dl();
  function r() {
    (this.__data__ = new i()), (this.size = 0);
  }
  return (Od = r), Od;
}
var xd, h0;
function Dx() {
  if (h0) return xd;
  h0 = 1;
  function i(r) {
    var n = this.__data__,
      o = n.delete(r);
    return (this.size = n.size), o;
  }
  return (xd = i), xd;
}
var Pd, m0;
function Mx() {
  if (m0) return Pd;
  m0 = 1;
  function i(r) {
    return this.__data__.get(r);
  }
  return (Pd = i), Pd;
}
var Td, g0;
function Fx() {
  if (g0) return Td;
  g0 = 1;
  function i(r) {
    return this.__data__.has(r);
  }
  return (Td = i), Td;
}
var Rd, y0;
function $x() {
  if (y0) return Rd;
  y0 = 1;
  var i = dl(),
    r = Eh(),
    n = bh(),
    o = 200;
  function a(l, c) {
    var d = this.__data__;
    if (d instanceof i) {
      var h = d.__data__;
      if (!r || h.length < o - 1) return h.push([l, c]), (this.size = ++d.size), this;
      d = this.__data__ = new n(h);
    }
    return d.set(l, c), (this.size = d.size), this;
  }
  return (Rd = a), Rd;
}
var Id, v0;
function Oh() {
  if (v0) return Id;
  v0 = 1;
  var i = dl(),
    r = jx(),
    n = Dx(),
    o = Mx(),
    a = Fx(),
    l = $x();
  function c(d) {
    var h = (this.__data__ = new i(d));
    this.size = h.size;
  }
  return (
    (c.prototype.clear = r),
    (c.prototype.delete = n),
    (c.prototype.get = o),
    (c.prototype.has = a),
    (c.prototype.set = l),
    (Id = c),
    Id
  );
}
var Nd, w0;
function US() {
  if (w0) return Nd;
  w0 = 1;
  function i(r, n) {
    for (var o = -1, a = r == null ? 0 : r.length; ++o < a && n(r[o], o, r) !== !1; );
    return r;
  }
  return (Nd = i), Nd;
}
var kd, _0;
function HS() {
  if (_0) return kd;
  _0 = 1;
  var i = xi(),
    r = (function () {
      try {
        var n = i(Object, 'defineProperty');
        return n({}, '', {}), n;
      } catch {}
    })();
  return (kd = r), kd;
}
var Ad, S0;
function xh() {
  if (S0) return Ad;
  S0 = 1;
  var i = HS();
  function r(n, o, a) {
    o == '__proto__' && i ? i(n, o, { configurable: !0, enumerable: !0, value: a, writable: !0 }) : (n[o] = a);
  }
  return (Ad = r), Ad;
}
var Ld, E0;
function Ph() {
  if (E0) return Ld;
  E0 = 1;
  var i = xh(),
    r = Pa(),
    n = Object.prototype,
    o = n.hasOwnProperty;
  function a(l, c, d) {
    var h = l[c];
    (!(o.call(l, c) && r(h, d)) || (d === void 0 && !(c in l))) && i(l, c, d);
  }
  return (Ld = a), Ld;
}
var jd, b0;
function mo() {
  if (b0) return jd;
  b0 = 1;
  var i = Ph(),
    r = xh();
  function n(o, a, l, c) {
    var d = !l;
    l || (l = {});
    for (var h = -1, g = a.length; ++h < g; ) {
      var y = a[h],
        w = c ? c(l[y], o[y], y, l, o) : void 0;
      w === void 0 && (w = o[y]), d ? r(l, y, w) : i(l, y, w);
    }
    return l;
  }
  return (jd = n), jd;
}
var Dd, C0;
function KS() {
  if (C0) return Dd;
  C0 = 1;
  function i(r, n) {
    for (var o = -1, a = Array(r); ++o < r; ) a[o] = n(o);
    return a;
  }
  return (Dd = i), Dd;
}
var Md, O0;
function zx() {
  if (O0) return Md;
  O0 = 1;
  var i = ei(),
    r = Br(),
    n = '[object Arguments]';
  function o(a) {
    return r(a) && i(a) == n;
  }
  return (Md = o), Md;
}
var Fd, x0;
function Ta() {
  if (x0) return Fd;
  x0 = 1;
  var i = zx(),
    r = Br(),
    n = Object.prototype,
    o = n.hasOwnProperty,
    a = n.propertyIsEnumerable,
    l = i(
      (function () {
        return arguments;
      })()
    )
      ? i
      : function (c) {
          return r(c) && o.call(c, 'callee') && !a.call(c, 'callee');
        };
  return (Fd = l), Fd;
}
var da = { exports: {} },
  $d,
  P0;
function qx() {
  if (P0) return $d;
  P0 = 1;
  function i() {
    return !1;
  }
  return ($d = i), $d;
}
da.exports;
var T0;
function Ra() {
  return (
    T0 ||
      ((T0 = 1),
      (function (i, r) {
        var n = qr(),
          o = qx(),
          a = r && !r.nodeType && r,
          l = a && !0 && i && !i.nodeType && i,
          c = l && l.exports === a,
          d = c ? n.Buffer : void 0,
          h = d ? d.isBuffer : void 0,
          g = h || o;
        i.exports = g;
      })(da, da.exports)),
    da.exports
  );
}
var zd, R0;
function hl() {
  if (R0) return zd;
  R0 = 1;
  var i = 9007199254740991,
    r = /^(?:0|[1-9]\d*)$/;
  function n(o, a) {
    var l = typeof o;
    return (a = a ?? i), !!a && (l == 'number' || (l != 'symbol' && r.test(o))) && o > -1 && o % 1 == 0 && o < a;
  }
  return (zd = n), zd;
}
var qd, I0;
function Th() {
  if (I0) return qd;
  I0 = 1;
  var i = 9007199254740991;
  function r(n) {
    return typeof n == 'number' && n > -1 && n % 1 == 0 && n <= i;
  }
  return (qd = r), qd;
}
var Bd, N0;
function Bx() {
  if (N0) return Bd;
  N0 = 1;
  var i = ei(),
    r = Th(),
    n = Br(),
    o = '[object Arguments]',
    a = '[object Array]',
    l = '[object Boolean]',
    c = '[object Date]',
    d = '[object Error]',
    h = '[object Function]',
    g = '[object Map]',
    y = '[object Number]',
    w = '[object Object]',
    S = '[object RegExp]',
    _ = '[object Set]',
    x = '[object String]',
    T = '[object WeakMap]',
    O = '[object ArrayBuffer]',
    L = '[object DataView]',
    I = '[object Float32Array]',
    $ = '[object Float64Array]',
    H = '[object Int8Array]',
    V = '[object Int16Array]',
    F = '[object Int32Array]',
    b = '[object Uint8Array]',
    q = '[object Uint8ClampedArray]',
    W = '[object Uint16Array]',
    X = '[object Uint32Array]',
    G = {};
  (G[I] = G[$] = G[H] = G[V] = G[F] = G[b] = G[q] = G[W] = G[X] = !0),
    (G[o] = G[a] = G[O] = G[l] = G[L] = G[c] = G[d] = G[h] = G[g] = G[y] = G[w] = G[S] = G[_] = G[x] = G[T] = !1);
  function oe(ie) {
    return n(ie) && r(ie.length) && !!G[i(ie)];
  }
  return (Bd = oe), Bd;
}
var Ud, k0;
function Rh() {
  if (k0) return Ud;
  k0 = 1;
  function i(r) {
    return function (n) {
      return r(n);
    };
  }
  return (Ud = i), Ud;
}
var fa = { exports: {} };
fa.exports;
var A0;
function Ih() {
  return (
    A0 ||
      ((A0 = 1),
      (function (i, r) {
        var n = MS(),
          o = r && !r.nodeType && r,
          a = o && !0 && i && !i.nodeType && i,
          l = a && a.exports === o,
          c = l && n.process,
          d = (function () {
            try {
              var h = a && a.require && a.require('util').types;
              return h || (c && c.binding && c.binding('util'));
            } catch {}
          })();
        i.exports = d;
      })(fa, fa.exports)),
    fa.exports
  );
}
var Hd, L0;
function ml() {
  if (L0) return Hd;
  L0 = 1;
  var i = Bx(),
    r = Rh(),
    n = Ih(),
    o = n && n.isTypedArray,
    a = o ? r(o) : i;
  return (Hd = a), Hd;
}
var Kd, j0;
function VS() {
  if (j0) return Kd;
  j0 = 1;
  var i = KS(),
    r = Ta(),
    n = ir(),
    o = Ra(),
    a = hl(),
    l = ml(),
    c = Object.prototype,
    d = c.hasOwnProperty;
  function h(g, y) {
    var w = n(g),
      S = !w && r(g),
      _ = !w && !S && o(g),
      x = !w && !S && !_ && l(g),
      T = w || S || _ || x,
      O = T ? i(g.length, String) : [],
      L = O.length;
    for (var I in g)
      (y || d.call(g, I)) &&
        !(
          T &&
          (I == 'length' ||
            (_ && (I == 'offset' || I == 'parent')) ||
            (x && (I == 'buffer' || I == 'byteLength' || I == 'byteOffset')) ||
            a(I, L))
        ) &&
        O.push(I);
    return O;
  }
  return (Kd = h), Kd;
}
var Vd, D0;
function gl() {
  if (D0) return Vd;
  D0 = 1;
  var i = Object.prototype;
  function r(n) {
    var o = n && n.constructor,
      a = (typeof o == 'function' && o.prototype) || i;
    return n === a;
  }
  return (Vd = r), Vd;
}
var Wd, M0;
function WS() {
  if (M0) return Wd;
  M0 = 1;
  function i(r, n) {
    return function (o) {
      return r(n(o));
    };
  }
  return (Wd = i), Wd;
}
var Gd, F0;
function Ux() {
  if (F0) return Gd;
  F0 = 1;
  var i = WS(),
    r = i(Object.keys, Object);
  return (Gd = r), Gd;
}
var Xd, $0;
function GS() {
  if ($0) return Xd;
  $0 = 1;
  var i = gl(),
    r = Ux(),
    n = Object.prototype,
    o = n.hasOwnProperty;
  function a(l) {
    if (!i(l)) return r(l);
    var c = [];
    for (var d in Object(l)) o.call(l, d) && d != 'constructor' && c.push(d);
    return c;
  }
  return (Xd = a), Xd;
}
var Yd, z0;
function go() {
  if (z0) return Yd;
  z0 = 1;
  var i = ll(),
    r = Th();
  function n(o) {
    return o != null && r(o.length) && !i(o);
  }
  return (Yd = n), Yd;
}
var Qd, q0;
function yl() {
  if (q0) return Qd;
  q0 = 1;
  var i = VS(),
    r = GS(),
    n = go();
  function o(a) {
    return n(a) ? i(a) : r(a);
  }
  return (Qd = o), Qd;
}
var Zd, B0;
function Hx() {
  if (B0) return Zd;
  B0 = 1;
  var i = mo(),
    r = yl();
  function n(o, a) {
    return o && i(a, r(a), o);
  }
  return (Zd = n), Zd;
}
var Jd, U0;
function Kx() {
  if (U0) return Jd;
  U0 = 1;
  function i(r) {
    var n = [];
    if (r != null) for (var o in Object(r)) n.push(o);
    return n;
  }
  return (Jd = i), Jd;
}
var ef, H0;
function Vx() {
  if (H0) return ef;
  H0 = 1;
  var i = Tr(),
    r = gl(),
    n = Kx(),
    o = Object.prototype,
    a = o.hasOwnProperty;
  function l(c) {
    if (!i(c)) return n(c);
    var d = r(c),
      h = [];
    for (var g in c) (g == 'constructor' && (d || !a.call(c, g))) || h.push(g);
    return h;
  }
  return (ef = l), ef;
}
var tf, K0;
function Ia() {
  if (K0) return tf;
  K0 = 1;
  var i = VS(),
    r = Vx(),
    n = go();
  function o(a) {
    return n(a) ? i(a, !0) : r(a);
  }
  return (tf = o), tf;
}
var rf, V0;
function Wx() {
  if (V0) return rf;
  V0 = 1;
  var i = mo(),
    r = Ia();
  function n(o, a) {
    return o && i(a, r(a), o);
  }
  return (rf = n), rf;
}
var pa = { exports: {} };
pa.exports;
var W0;
function XS() {
  return (
    W0 ||
      ((W0 = 1),
      (function (i, r) {
        var n = qr(),
          o = r && !r.nodeType && r,
          a = o && !0 && i && !i.nodeType && i,
          l = a && a.exports === o,
          c = l ? n.Buffer : void 0,
          d = c ? c.allocUnsafe : void 0;
        function h(g, y) {
          if (y) return g.slice();
          var w = g.length,
            S = d ? d(w) : new g.constructor(w);
          return g.copy(S), S;
        }
        i.exports = h;
      })(pa, pa.exports)),
    pa.exports
  );
}
var nf, G0;
function YS() {
  if (G0) return nf;
  G0 = 1;
  function i(r, n) {
    var o = -1,
      a = r.length;
    for (n || (n = Array(a)); ++o < a; ) n[o] = r[o];
    return n;
  }
  return (nf = i), nf;
}
var of, X0;
function Gx() {
  if (X0) return of;
  X0 = 1;
  function i(r, n) {
    for (var o = -1, a = r == null ? 0 : r.length, l = 0, c = []; ++o < a; ) {
      var d = r[o];
      n(d, o, r) && (c[l++] = d);
    }
    return c;
  }
  return (of = i), of;
}
var af, Y0;
function QS() {
  if (Y0) return af;
  Y0 = 1;
  function i() {
    return [];
  }
  return (af = i), af;
}
var sf, Q0;
function Nh() {
  if (Q0) return sf;
  Q0 = 1;
  var i = Gx(),
    r = QS(),
    n = Object.prototype,
    o = n.propertyIsEnumerable,
    a = Object.getOwnPropertySymbols,
    l = a
      ? function (c) {
          return c == null
            ? []
            : ((c = Object(c)),
              i(a(c), function (d) {
                return o.call(c, d);
              }));
        }
      : r;
  return (sf = l), sf;
}
var lf, Z0;
function Xx() {
  if (Z0) return lf;
  Z0 = 1;
  var i = mo(),
    r = Nh();
  function n(o, a) {
    return i(o, r(o), a);
  }
  return (lf = n), lf;
}
var uf, J0;
function kh() {
  if (J0) return uf;
  J0 = 1;
  function i(r, n) {
    for (var o = -1, a = n.length, l = r.length; ++o < a; ) r[l + o] = n[o];
    return r;
  }
  return (uf = i), uf;
}
var cf, ew;
function Ah() {
  if (ew) return cf;
  ew = 1;
  var i = WS(),
    r = i(Object.getPrototypeOf, Object);
  return (cf = r), cf;
}
var df, tw;
function ZS() {
  if (tw) return df;
  tw = 1;
  var i = kh(),
    r = Ah(),
    n = Nh(),
    o = QS(),
    a = Object.getOwnPropertySymbols,
    l = a
      ? function (c) {
          for (var d = []; c; ) i(d, n(c)), (c = r(c));
          return d;
        }
      : o;
  return (df = l), df;
}
var ff, rw;
function Yx() {
  if (rw) return ff;
  rw = 1;
  var i = mo(),
    r = ZS();
  function n(o, a) {
    return i(o, r(o), a);
  }
  return (ff = n), ff;
}
var pf, nw;
function JS() {
  if (nw) return pf;
  nw = 1;
  var i = kh(),
    r = ir();
  function n(o, a, l) {
    var c = a(o);
    return r(o) ? c : i(c, l(o));
  }
  return (pf = n), pf;
}
var hf, iw;
function e1() {
  if (iw) return hf;
  iw = 1;
  var i = JS(),
    r = Nh(),
    n = yl();
  function o(a) {
    return i(a, n, r);
  }
  return (hf = o), hf;
}
var mf, ow;
function t1() {
  if (ow) return mf;
  ow = 1;
  var i = JS(),
    r = ZS(),
    n = Ia();
  function o(a) {
    return i(a, n, r);
  }
  return (mf = o), mf;
}
var gf, aw;
function Qx() {
  if (aw) return gf;
  aw = 1;
  var i = xi(),
    r = qr(),
    n = i(r, 'DataView');
  return (gf = n), gf;
}
var yf, sw;
function Zx() {
  if (sw) return yf;
  sw = 1;
  var i = xi(),
    r = qr(),
    n = i(r, 'Promise');
  return (yf = n), yf;
}
var vf, lw;
function Jx() {
  if (lw) return vf;
  lw = 1;
  var i = xi(),
    r = qr(),
    n = i(r, 'Set');
  return (vf = n), vf;
}
var wf, uw;
function eP() {
  if (uw) return wf;
  uw = 1;
  var i = xi(),
    r = qr(),
    n = i(r, 'WeakMap');
  return (wf = n), wf;
}
var _f, cw;
function Na() {
  if (cw) return _f;
  cw = 1;
  var i = Qx(),
    r = Eh(),
    n = Zx(),
    o = Jx(),
    a = eP(),
    l = ei(),
    c = FS(),
    d = '[object Map]',
    h = '[object Object]',
    g = '[object Promise]',
    y = '[object Set]',
    w = '[object WeakMap]',
    S = '[object DataView]',
    _ = c(i),
    x = c(r),
    T = c(n),
    O = c(o),
    L = c(a),
    I = l;
  return (
    ((i && I(new i(new ArrayBuffer(1))) != S) ||
      (r && I(new r()) != d) ||
      (n && I(n.resolve()) != g) ||
      (o && I(new o()) != y) ||
      (a && I(new a()) != w)) &&
      (I = function ($) {
        var H = l($),
          V = H == h ? $.constructor : void 0,
          F = V ? c(V) : '';
        if (F)
          switch (F) {
            case _:
              return S;
            case x:
              return d;
            case T:
              return g;
            case O:
              return y;
            case L:
              return w;
          }
        return H;
      }),
    (_f = I),
    _f
  );
}
var Sf, dw;
function tP() {
  if (dw) return Sf;
  dw = 1;
  var i = Object.prototype,
    r = i.hasOwnProperty;
  function n(o) {
    var a = o.length,
      l = new o.constructor(a);
    return a && typeof o[0] == 'string' && r.call(o, 'index') && ((l.index = o.index), (l.input = o.input)), l;
  }
  return (Sf = n), Sf;
}
var Ef, fw;
function r1() {
  if (fw) return Ef;
  fw = 1;
  var i = qr(),
    r = i.Uint8Array;
  return (Ef = r), Ef;
}
var bf, pw;
function Lh() {
  if (pw) return bf;
  pw = 1;
  var i = r1();
  function r(n) {
    var o = new n.constructor(n.byteLength);
    return new i(o).set(new i(n)), o;
  }
  return (bf = r), bf;
}
var Cf, hw;
function rP() {
  if (hw) return Cf;
  hw = 1;
  var i = Lh();
  function r(n, o) {
    var a = o ? i(n.buffer) : n.buffer;
    return new n.constructor(a, n.byteOffset, n.byteLength);
  }
  return (Cf = r), Cf;
}
var Of, mw;
function nP() {
  if (mw) return Of;
  mw = 1;
  var i = /\w*$/;
  function r(n) {
    var o = new n.constructor(n.source, i.exec(n));
    return (o.lastIndex = n.lastIndex), o;
  }
  return (Of = r), Of;
}
var xf, gw;
function iP() {
  if (gw) return xf;
  gw = 1;
  var i = po(),
    r = i ? i.prototype : void 0,
    n = r ? r.valueOf : void 0;
  function o(a) {
    return n ? Object(n.call(a)) : {};
  }
  return (xf = o), xf;
}
var Pf, yw;
function n1() {
  if (yw) return Pf;
  yw = 1;
  var i = Lh();
  function r(n, o) {
    var a = o ? i(n.buffer) : n.buffer;
    return new n.constructor(a, n.byteOffset, n.length);
  }
  return (Pf = r), Pf;
}
var Tf, vw;
function oP() {
  if (vw) return Tf;
  vw = 1;
  var i = Lh(),
    r = rP(),
    n = nP(),
    o = iP(),
    a = n1(),
    l = '[object Boolean]',
    c = '[object Date]',
    d = '[object Map]',
    h = '[object Number]',
    g = '[object RegExp]',
    y = '[object Set]',
    w = '[object String]',
    S = '[object Symbol]',
    _ = '[object ArrayBuffer]',
    x = '[object DataView]',
    T = '[object Float32Array]',
    O = '[object Float64Array]',
    L = '[object Int8Array]',
    I = '[object Int16Array]',
    $ = '[object Int32Array]',
    H = '[object Uint8Array]',
    V = '[object Uint8ClampedArray]',
    F = '[object Uint16Array]',
    b = '[object Uint32Array]';
  function q(W, X, G) {
    var oe = W.constructor;
    switch (X) {
      case _:
        return i(W);
      case l:
      case c:
        return new oe(+W);
      case x:
        return r(W, G);
      case T:
      case O:
      case L:
      case I:
      case $:
      case H:
      case V:
      case F:
      case b:
        return a(W, G);
      case d:
        return new oe();
      case h:
      case w:
        return new oe(W);
      case g:
        return n(W);
      case y:
        return new oe();
      case S:
        return o(W);
    }
  }
  return (Tf = q), Tf;
}
var Rf, ww;
function aP() {
  if (ww) return Rf;
  ww = 1;
  var i = Tr(),
    r = Object.create,
    n = (function () {
      function o() {}
      return function (a) {
        if (!i(a)) return {};
        if (r) return r(a);
        o.prototype = a;
        var l = new o();
        return (o.prototype = void 0), l;
      };
    })();
  return (Rf = n), Rf;
}
var If, _w;
function i1() {
  if (_w) return If;
  _w = 1;
  var i = aP(),
    r = Ah(),
    n = gl();
  function o(a) {
    return typeof a.constructor == 'function' && !n(a) ? i(r(a)) : {};
  }
  return (If = o), If;
}
var Nf, Sw;
function sP() {
  if (Sw) return Nf;
  Sw = 1;
  var i = Na(),
    r = Br(),
    n = '[object Map]';
  function o(a) {
    return r(a) && i(a) == n;
  }
  return (Nf = o), Nf;
}
var kf, Ew;
function lP() {
  if (Ew) return kf;
  Ew = 1;
  var i = sP(),
    r = Rh(),
    n = Ih(),
    o = n && n.isMap,
    a = o ? r(o) : i;
  return (kf = a), kf;
}
var Af, bw;
function uP() {
  if (bw) return Af;
  bw = 1;
  var i = Na(),
    r = Br(),
    n = '[object Set]';
  function o(a) {
    return r(a) && i(a) == n;
  }
  return (Af = o), Af;
}
var Lf, Cw;
function cP() {
  if (Cw) return Lf;
  Cw = 1;
  var i = uP(),
    r = Rh(),
    n = Ih(),
    o = n && n.isSet,
    a = o ? r(o) : i;
  return (Lf = a), Lf;
}
var jf, Ow;
function o1() {
  if (Ow) return jf;
  Ow = 1;
  var i = Oh(),
    r = US(),
    n = Ph(),
    o = Hx(),
    a = Wx(),
    l = XS(),
    c = YS(),
    d = Xx(),
    h = Yx(),
    g = e1(),
    y = t1(),
    w = Na(),
    S = tP(),
    _ = oP(),
    x = i1(),
    T = ir(),
    O = Ra(),
    L = lP(),
    I = Tr(),
    $ = cP(),
    H = yl(),
    V = Ia(),
    F = 1,
    b = 2,
    q = 4,
    W = '[object Arguments]',
    X = '[object Array]',
    G = '[object Boolean]',
    oe = '[object Date]',
    ie = '[object Error]',
    fe = '[object Function]',
    me = '[object GeneratorFunction]',
    be = '[object Map]',
    Te = '[object Number]',
    U = '[object Object]',
    te = '[object RegExp]',
    ee = '[object Set]',
    k = '[object String]',
    K = '[object Symbol]',
    le = '[object WeakMap]',
    se = '[object ArrayBuffer]',
    pe = '[object DataView]',
    Ce = '[object Float32Array]',
    Ne = '[object Float64Array]',
    Re = '[object Int8Array]',
    ke = '[object Int16Array]',
    Ze = '[object Int32Array]',
    Xt = '[object Uint8Array]',
    it = '[object Uint8ClampedArray]',
    Bt = '[object Uint16Array]',
    Ur = '[object Uint32Array]',
    qe = {};
  (qe[W] =
    qe[X] =
    qe[se] =
    qe[pe] =
    qe[G] =
    qe[oe] =
    qe[Ce] =
    qe[Ne] =
    qe[Re] =
    qe[ke] =
    qe[Ze] =
    qe[be] =
    qe[Te] =
    qe[U] =
    qe[te] =
    qe[ee] =
    qe[k] =
    qe[K] =
    qe[Xt] =
    qe[it] =
    qe[Bt] =
    qe[Ur] =
      !0),
    (qe[ie] = qe[fe] = qe[le] = !1);
  function Tt(je, or, Ut, St, ct, Et) {
    var ot,
      vt = or & F,
      Rt = or & b,
      Hr = or & q;
    if ((Ut && (ot = ct ? Ut(je, St, ct, Et) : Ut(je)), ot !== void 0)) return ot;
    if (!I(je)) return je;
    var ar = T(je);
    if (ar) {
      if (((ot = S(je)), !vt)) return c(je, ot);
    } else {
      var Ye = w(je),
        mt = Ye == fe || Ye == me;
      if (O(je)) return l(je, vt);
      if (Ye == U || Ye == W || (mt && !ct)) {
        if (((ot = Rt || mt ? {} : x(je)), !vt)) return Rt ? h(je, a(ot, je)) : d(je, o(ot, je));
      } else {
        if (!qe[Ye]) return ct ? je : {};
        ot = _(je, Ye, vt);
      }
    }
    Et || (Et = new i());
    var Ht = Et.get(je);
    if (Ht) return Ht;
    Et.set(je, ot),
      $(je)
        ? je.forEach(function (It) {
            ot.add(Tt(It, or, Ut, It, je, Et));
          })
        : L(je) &&
          je.forEach(function (It, at) {
            ot.set(at, Tt(It, or, Ut, at, je, Et));
          });
    var sr = Hr ? (Rt ? y : g) : Rt ? V : H,
      mr = ar ? void 0 : sr(je);
    return (
      r(mr || je, function (It, at) {
        mr && ((at = It), (It = je[at])), n(ot, at, Tt(It, or, Ut, at, je, Et));
      }),
      ot
    );
  }
  return (jf = Tt), jf;
}
var Df, xw;
function dP() {
  if (xw) return Df;
  xw = 1;
  function i(r) {
    var n = r == null ? 0 : r.length;
    return n ? r[n - 1] : void 0;
  }
  return (Df = i), Df;
}
var Mf, Pw;
function fP() {
  if (Pw) return Mf;
  Pw = 1;
  function i(r, n, o) {
    var a = -1,
      l = r.length;
    n < 0 && (n = -n > l ? 0 : l + n),
      (o = o > l ? l : o),
      o < 0 && (o += l),
      (l = n > o ? 0 : (o - n) >>> 0),
      (n >>>= 0);
    for (var c = Array(l); ++a < l; ) c[a] = r[a + n];
    return c;
  }
  return (Mf = i), Mf;
}
var Ff, Tw;
function pP() {
  if (Tw) return Ff;
  Tw = 1;
  var i = Ch(),
    r = fP();
  function n(o, a) {
    return a.length < 2 ? o : i(o, r(a, 0, -1));
  }
  return (Ff = n), Ff;
}
var $f, Rw;
function hP() {
  if (Rw) return $f;
  Rw = 1;
  var i = ho(),
    r = dP(),
    n = pP(),
    o = pl();
  function a(l, c) {
    return (c = i(c, l)), (l = n(l, c)), l == null || delete l[o(r(c))];
  }
  return ($f = a), $f;
}
var zf, Iw;
function a1() {
  if (Iw) return zf;
  Iw = 1;
  var i = ei(),
    r = Ah(),
    n = Br(),
    o = '[object Object]',
    a = Function.prototype,
    l = Object.prototype,
    c = a.toString,
    d = l.hasOwnProperty,
    h = c.call(Object);
  function g(y) {
    if (!n(y) || i(y) != o) return !1;
    var w = r(y);
    if (w === null) return !0;
    var S = d.call(w, 'constructor') && w.constructor;
    return typeof S == 'function' && S instanceof S && c.call(S) == h;
  }
  return (zf = g), zf;
}
var qf, Nw;
function mP() {
  if (Nw) return qf;
  Nw = 1;
  var i = a1();
  function r(n) {
    return i(n) ? void 0 : n;
  }
  return (qf = r), qf;
}
var Bf, kw;
function gP() {
  if (kw) return Bf;
  kw = 1;
  var i = po(),
    r = Ta(),
    n = ir(),
    o = i ? i.isConcatSpreadable : void 0;
  function a(l) {
    return n(l) || r(l) || !!(o && l && l[o]);
  }
  return (Bf = a), Bf;
}
var Uf, Aw;
function yP() {
  if (Aw) return Uf;
  Aw = 1;
  var i = kh(),
    r = gP();
  function n(o, a, l, c, d) {
    var h = -1,
      g = o.length;
    for (l || (l = r), d || (d = []); ++h < g; ) {
      var y = o[h];
      a > 0 && l(y) ? (a > 1 ? n(y, a - 1, l, c, d) : i(d, y)) : c || (d[d.length] = y);
    }
    return d;
  }
  return (Uf = n), Uf;
}
var Hf, Lw;
function vP() {
  if (Lw) return Hf;
  Lw = 1;
  var i = yP();
  function r(n) {
    var o = n == null ? 0 : n.length;
    return o ? i(n, 1) : [];
  }
  return (Hf = r), Hf;
}
var Kf, jw;
function wP() {
  if (jw) return Kf;
  jw = 1;
  function i(r, n, o) {
    switch (o.length) {
      case 0:
        return r.call(n);
      case 1:
        return r.call(n, o[0]);
      case 2:
        return r.call(n, o[0], o[1]);
      case 3:
        return r.call(n, o[0], o[1], o[2]);
    }
    return r.apply(n, o);
  }
  return (Kf = i), Kf;
}
var Vf, Dw;
function s1() {
  if (Dw) return Vf;
  Dw = 1;
  var i = wP(),
    r = Math.max;
  function n(o, a, l) {
    return (
      (a = r(a === void 0 ? o.length - 1 : a, 0)),
      function () {
        for (var c = arguments, d = -1, h = r(c.length - a, 0), g = Array(h); ++d < h; ) g[d] = c[a + d];
        d = -1;
        for (var y = Array(a + 1); ++d < a; ) y[d] = c[d];
        return (y[a] = l(g)), i(o, this, y);
      }
    );
  }
  return (Vf = n), Vf;
}
var Wf, Mw;
function _P() {
  if (Mw) return Wf;
  Mw = 1;
  function i(r) {
    return function () {
      return r;
    };
  }
  return (Wf = i), Wf;
}
var Gf, Fw;
function jh() {
  if (Fw) return Gf;
  Fw = 1;
  function i(r) {
    return r;
  }
  return (Gf = i), Gf;
}
var Xf, $w;
function SP() {
  if ($w) return Xf;
  $w = 1;
  var i = _P(),
    r = HS(),
    n = jh(),
    o = r
      ? function (a, l) {
          return r(a, 'toString', { configurable: !0, enumerable: !1, value: i(l), writable: !0 });
        }
      : n;
  return (Xf = o), Xf;
}
var Yf, zw;
function EP() {
  if (zw) return Yf;
  zw = 1;
  var i = 800,
    r = 16,
    n = Date.now;
  function o(a) {
    var l = 0,
      c = 0;
    return function () {
      var d = n(),
        h = r - (d - c);
      if (((c = d), h > 0)) {
        if (++l >= i) return arguments[0];
      } else l = 0;
      return a.apply(void 0, arguments);
    };
  }
  return (Yf = o), Yf;
}
var Qf, qw;
function l1() {
  if (qw) return Qf;
  qw = 1;
  var i = SP(),
    r = EP(),
    n = r(i);
  return (Qf = n), Qf;
}
var Zf, Bw;
function u1() {
  if (Bw) return Zf;
  Bw = 1;
  var i = vP(),
    r = s1(),
    n = l1();
  function o(a) {
    return n(r(a, void 0, i), a + '');
  }
  return (Zf = o), Zf;
}
var Jf, Uw;
function bP() {
  if (Uw) return Jf;
  Uw = 1;
  var i = $S(),
    r = o1(),
    n = hP(),
    o = ho(),
    a = mo(),
    l = mP(),
    c = u1(),
    d = t1(),
    h = 1,
    g = 2,
    y = 4,
    w = c(function (S, _) {
      var x = {};
      if (S == null) return x;
      var T = !1;
      (_ = i(_, function (L) {
        return (L = o(L, S)), T || (T = L.length > 1), L;
      })),
        a(S, d(S), x),
        T && (x = r(x, h | g | y, l));
      for (var O = _.length; O--; ) n(x, _[O]);
      return x;
    });
  return (Jf = w), Jf;
}
var CP = bP();
const yo = ut(CP),
  vl = { PREFIX: `${nr}-typography` },
  qt = {
    WEIGHT: ['light', 'regular', 'medium', 'semibold', 'bold', 'default'],
    TYPE: ['primary', 'secondary', 'danger', 'warning', 'success', 'tertiary', 'quaternary'],
    SIZE: ['normal', 'small', 'inherit'],
    SPACING: ['normal', 'extended'],
    HEADING: [1, 2, 3, 4, 5, 6],
    RULE: ['text', 'numbers', 'bytes-decimal', 'bytes-binary', 'percentages', 'exponential'],
    TRUNCATE: ['ceil', 'floor', 'round'],
  };
var OP = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const xP = vl.PREFIX;
let wl = class extends A.PureComponent {
  render() {
    const r = this.props,
      { component: n, className: o, children: a, forwardRef: l } = r,
      c = OP(r, ['component', 'className', 'children', 'forwardRef']),
      d = n,
      h = de(xP, o);
    return E.createElement(d, Object.assign({ className: h, ref: l }, yo(c, 'tooltipRef')), a);
  }
};
wl.defaultProps = { component: 'article', style: {}, className: '' };
wl.propTypes = { component: m.string, style: m.object, className: m.string };
var PP = ll();
const Dh = ut(PP);
var ep, Hw;
function TP() {
  if (Hw) return ep;
  Hw = 1;
  function i(r) {
    return r === null;
  }
  return (ep = i), ep;
}
var RP = TP();
const IP = ut(RP);
var tp, Kw;
function NP() {
  if (Kw) return tp;
  Kw = 1;
  var i = ei(),
    r = ir(),
    n = Br(),
    o = '[object String]';
  function a(l) {
    return typeof l == 'string' || (!r(l) && n(l) && i(l) == o);
  }
  return (tp = a), tp;
}
var kP = NP();
const ga = ut(kP);
var rp, Vw;
function c1() {
  if (Vw) return rp;
  Vw = 1;
  var i = xh(),
    r = Pa();
  function n(o, a, l) {
    ((l !== void 0 && !r(o[a], l)) || (l === void 0 && !(a in o))) && i(o, a, l);
  }
  return (rp = n), rp;
}
var np, Ww;
function AP() {
  if (Ww) return np;
  Ww = 1;
  function i(r) {
    return function (n, o, a) {
      for (var l = -1, c = Object(n), d = a(n), h = d.length; h--; ) {
        var g = d[r ? h : ++l];
        if (o(c[g], g, c) === !1) break;
      }
      return n;
    };
  }
  return (np = i), np;
}
var ip, Gw;
function d1() {
  if (Gw) return ip;
  Gw = 1;
  var i = AP(),
    r = i();
  return (ip = r), ip;
}
var op, Xw;
function LP() {
  if (Xw) return op;
  Xw = 1;
  var i = go(),
    r = Br();
  function n(o) {
    return r(o) && i(o);
  }
  return (op = n), op;
}
var ap, Yw;
function f1() {
  if (Yw) return ap;
  Yw = 1;
  function i(r, n) {
    if (!(n === 'constructor' && typeof r[n] == 'function') && n != '__proto__') return r[n];
  }
  return (ap = i), ap;
}
var sp, Qw;
function jP() {
  if (Qw) return sp;
  Qw = 1;
  var i = mo(),
    r = Ia();
  function n(o) {
    return i(o, r(o));
  }
  return (sp = n), sp;
}
var lp, Zw;
function DP() {
  if (Zw) return lp;
  Zw = 1;
  var i = c1(),
    r = XS(),
    n = n1(),
    o = YS(),
    a = i1(),
    l = Ta(),
    c = ir(),
    d = LP(),
    h = Ra(),
    g = ll(),
    y = Tr(),
    w = a1(),
    S = ml(),
    _ = f1(),
    x = jP();
  function T(O, L, I, $, H, V, F) {
    var b = _(O, I),
      q = _(L, I),
      W = F.get(q);
    if (W) {
      i(O, I, W);
      return;
    }
    var X = V ? V(b, q, I + '', O, L, F) : void 0,
      G = X === void 0;
    if (G) {
      var oe = c(q),
        ie = !oe && h(q),
        fe = !oe && !ie && S(q);
      (X = q),
        oe || ie || fe
          ? c(b)
            ? (X = b)
            : d(b)
            ? (X = o(b))
            : ie
            ? ((G = !1), (X = r(q, !0)))
            : fe
            ? ((G = !1), (X = n(q, !0)))
            : (X = [])
          : w(q) || l(q)
          ? ((X = b), l(b) ? (X = x(b)) : (!y(b) || g(b)) && (X = a(q)))
          : (G = !1);
    }
    G && (F.set(q, X), H(X, q, $, V, F), F.delete(q)), i(O, I, X);
  }
  return (lp = T), lp;
}
var up, Jw;
function MP() {
  if (Jw) return up;
  Jw = 1;
  var i = Oh(),
    r = c1(),
    n = d1(),
    o = DP(),
    a = Tr(),
    l = Ia(),
    c = f1();
  function d(h, g, y, w, S) {
    h !== g &&
      n(
        g,
        function (_, x) {
          if ((S || (S = new i()), a(_))) o(h, g, x, y, d, w, S);
          else {
            var T = w ? w(c(h, x), _, x + '', h, g, S) : void 0;
            T === void 0 && (T = _), r(h, x, T);
          }
        },
        l
      );
  }
  return (up = d), up;
}
var cp, e_;
function FP() {
  if (e_) return cp;
  e_ = 1;
  var i = jh(),
    r = s1(),
    n = l1();
  function o(a, l) {
    return n(r(a, l, i), a + '');
  }
  return (cp = o), cp;
}
var dp, t_;
function $P() {
  if (t_) return dp;
  t_ = 1;
  var i = Pa(),
    r = go(),
    n = hl(),
    o = Tr();
  function a(l, c, d) {
    if (!o(d)) return !1;
    var h = typeof c;
    return (h == 'number' ? r(d) && n(c, d.length) : h == 'string' && c in d) ? i(d[c], l) : !1;
  }
  return (dp = a), dp;
}
var fp, r_;
function zP() {
  if (r_) return fp;
  r_ = 1;
  var i = FP(),
    r = $P();
  function n(o) {
    return i(function (a, l) {
      var c = -1,
        d = l.length,
        h = d > 1 ? l[d - 1] : void 0,
        g = d > 2 ? l[2] : void 0;
      for (
        h = o.length > 3 && typeof h == 'function' ? (d--, h) : void 0,
          g && r(l[0], l[1], g) && ((h = d < 3 ? void 0 : h), (d = 1)),
          a = Object(a);
        ++c < d;

      ) {
        var y = l[c];
        y && o(a, y, c, h);
      }
      return a;
    });
  }
  return (fp = n), fp;
}
var pp, n_;
function qP() {
  if (n_) return pp;
  n_ = 1;
  var i = MP(),
    r = zP(),
    n = r(function (o, a, l) {
      i(o, a, l);
    });
  return (pp = n), pp;
}
var BP = qP();
const UP = ut(BP);
var hp, i_;
function HP() {
  if (i_) return hp;
  i_ = 1;
  function i(r) {
    return r === void 0;
  }
  return (hp = i), hp;
}
var KP = HP();
const Ws = ut(KP);
var mp, o_;
function VP() {
  if (o_) return mp;
  o_ = 1;
  var i = '__lodash_hash_undefined__';
  function r(n) {
    return this.__data__.set(n, i), this;
  }
  return (mp = r), mp;
}
var gp, a_;
function WP() {
  if (a_) return gp;
  a_ = 1;
  function i(r) {
    return this.__data__.has(r);
  }
  return (gp = i), gp;
}
var yp, s_;
function GP() {
  if (s_) return yp;
  s_ = 1;
  var i = bh(),
    r = VP(),
    n = WP();
  function o(a) {
    var l = -1,
      c = a == null ? 0 : a.length;
    for (this.__data__ = new i(); ++l < c; ) this.add(a[l]);
  }
  return (o.prototype.add = o.prototype.push = r), (o.prototype.has = n), (yp = o), yp;
}
var vp, l_;
function XP() {
  if (l_) return vp;
  l_ = 1;
  function i(r, n) {
    for (var o = -1, a = r == null ? 0 : r.length; ++o < a; ) if (n(r[o], o, r)) return !0;
    return !1;
  }
  return (vp = i), vp;
}
var wp, u_;
function YP() {
  if (u_) return wp;
  u_ = 1;
  function i(r, n) {
    return r.has(n);
  }
  return (wp = i), wp;
}
var _p, c_;
function p1() {
  if (c_) return _p;
  c_ = 1;
  var i = GP(),
    r = XP(),
    n = YP(),
    o = 1,
    a = 2;
  function l(c, d, h, g, y, w) {
    var S = h & o,
      _ = c.length,
      x = d.length;
    if (_ != x && !(S && x > _)) return !1;
    var T = w.get(c),
      O = w.get(d);
    if (T && O) return T == d && O == c;
    var L = -1,
      I = !0,
      $ = h & a ? new i() : void 0;
    for (w.set(c, d), w.set(d, c); ++L < _; ) {
      var H = c[L],
        V = d[L];
      if (g) var F = S ? g(V, H, L, d, c, w) : g(H, V, L, c, d, w);
      if (F !== void 0) {
        if (F) continue;
        I = !1;
        break;
      }
      if ($) {
        if (
          !r(d, function (b, q) {
            if (!n($, q) && (H === b || y(H, b, h, g, w))) return $.push(q);
          })
        ) {
          I = !1;
          break;
        }
      } else if (!(H === V || y(H, V, h, g, w))) {
        I = !1;
        break;
      }
    }
    return w.delete(c), w.delete(d), I;
  }
  return (_p = l), _p;
}
var Sp, d_;
function QP() {
  if (d_) return Sp;
  d_ = 1;
  function i(r) {
    var n = -1,
      o = Array(r.size);
    return (
      r.forEach(function (a, l) {
        o[++n] = [l, a];
      }),
      o
    );
  }
  return (Sp = i), Sp;
}
var Ep, f_;
function ZP() {
  if (f_) return Ep;
  f_ = 1;
  function i(r) {
    var n = -1,
      o = Array(r.size);
    return (
      r.forEach(function (a) {
        o[++n] = a;
      }),
      o
    );
  }
  return (Ep = i), Ep;
}
var bp, p_;
function JP() {
  if (p_) return bp;
  p_ = 1;
  var i = po(),
    r = r1(),
    n = Pa(),
    o = p1(),
    a = QP(),
    l = ZP(),
    c = 1,
    d = 2,
    h = '[object Boolean]',
    g = '[object Date]',
    y = '[object Error]',
    w = '[object Map]',
    S = '[object Number]',
    _ = '[object RegExp]',
    x = '[object Set]',
    T = '[object String]',
    O = '[object Symbol]',
    L = '[object ArrayBuffer]',
    I = '[object DataView]',
    $ = i ? i.prototype : void 0,
    H = $ ? $.valueOf : void 0;
  function V(F, b, q, W, X, G, oe) {
    switch (q) {
      case I:
        if (F.byteLength != b.byteLength || F.byteOffset != b.byteOffset) return !1;
        (F = F.buffer), (b = b.buffer);
      case L:
        return !(F.byteLength != b.byteLength || !G(new r(F), new r(b)));
      case h:
      case g:
      case S:
        return n(+F, +b);
      case y:
        return F.name == b.name && F.message == b.message;
      case _:
      case T:
        return F == b + '';
      case w:
        var ie = a;
      case x:
        var fe = W & c;
        if ((ie || (ie = l), F.size != b.size && !fe)) return !1;
        var me = oe.get(F);
        if (me) return me == b;
        (W |= d), oe.set(F, b);
        var be = o(ie(F), ie(b), W, X, G, oe);
        return oe.delete(F), be;
      case O:
        if (H) return H.call(F) == H.call(b);
    }
    return !1;
  }
  return (bp = V), bp;
}
var Cp, h_;
function eT() {
  if (h_) return Cp;
  h_ = 1;
  var i = e1(),
    r = 1,
    n = Object.prototype,
    o = n.hasOwnProperty;
  function a(l, c, d, h, g, y) {
    var w = d & r,
      S = i(l),
      _ = S.length,
      x = i(c),
      T = x.length;
    if (_ != T && !w) return !1;
    for (var O = _; O--; ) {
      var L = S[O];
      if (!(w ? L in c : o.call(c, L))) return !1;
    }
    var I = y.get(l),
      $ = y.get(c);
    if (I && $) return I == c && $ == l;
    var H = !0;
    y.set(l, c), y.set(c, l);
    for (var V = w; ++O < _; ) {
      L = S[O];
      var F = l[L],
        b = c[L];
      if (h) var q = w ? h(b, F, L, c, l, y) : h(F, b, L, l, c, y);
      if (!(q === void 0 ? F === b || g(F, b, d, h, y) : q)) {
        H = !1;
        break;
      }
      V || (V = L == 'constructor');
    }
    if (H && !V) {
      var W = l.constructor,
        X = c.constructor;
      W != X &&
        'constructor' in l &&
        'constructor' in c &&
        !(typeof W == 'function' && W instanceof W && typeof X == 'function' && X instanceof X) &&
        (H = !1);
    }
    return y.delete(l), y.delete(c), H;
  }
  return (Cp = a), Cp;
}
var Op, m_;
function tT() {
  if (m_) return Op;
  m_ = 1;
  var i = Oh(),
    r = p1(),
    n = JP(),
    o = eT(),
    a = Na(),
    l = ir(),
    c = Ra(),
    d = ml(),
    h = 1,
    g = '[object Arguments]',
    y = '[object Array]',
    w = '[object Object]',
    S = Object.prototype,
    _ = S.hasOwnProperty;
  function x(T, O, L, I, $, H) {
    var V = l(T),
      F = l(O),
      b = V ? y : a(T),
      q = F ? y : a(O);
    (b = b == g ? w : b), (q = q == g ? w : q);
    var W = b == w,
      X = q == w,
      G = b == q;
    if (G && c(T)) {
      if (!c(O)) return !1;
      (V = !0), (W = !1);
    }
    if (G && !W) return H || (H = new i()), V || d(T) ? r(T, O, L, I, $, H) : n(T, O, b, L, I, $, H);
    if (!(L & h)) {
      var oe = W && _.call(T, '__wrapped__'),
        ie = X && _.call(O, '__wrapped__');
      if (oe || ie) {
        var fe = oe ? T.value() : T,
          me = ie ? O.value() : O;
        return H || (H = new i()), $(fe, me, L, I, H);
      }
    }
    return G ? (H || (H = new i()), o(T, O, L, I, $, H)) : !1;
  }
  return (Op = x), Op;
}
var xp, g_;
function rT() {
  if (g_) return xp;
  g_ = 1;
  var i = tT(),
    r = Br();
  function n(o, a, l, c, d) {
    return o === a ? !0 : o == null || a == null || (!r(o) && !r(a)) ? o !== o && a !== a : i(o, a, l, c, n, d);
  }
  return (xp = n), xp;
}
var Pp, y_;
function nT() {
  if (y_) return Pp;
  y_ = 1;
  var i = rT();
  function r(n, o) {
    return i(n, o);
  }
  return (Pp = r), Pp;
}
var iT = nT();
const oo = ut(iT);
var Tp, v_;
function oT() {
  if (v_) return Tp;
  v_ = 1;
  var i = GS(),
    r = Na(),
    n = Ta(),
    o = ir(),
    a = go(),
    l = Ra(),
    c = gl(),
    d = ml(),
    h = '[object Map]',
    g = '[object Set]',
    y = Object.prototype,
    w = y.hasOwnProperty;
  function S(_) {
    if (_ == null) return !0;
    if (a(_) && (o(_) || typeof _ == 'string' || typeof _.splice == 'function' || l(_) || d(_) || n(_)))
      return !_.length;
    var x = r(_);
    if (x == h || x == g) return !_.size;
    if (c(_)) return !i(_).length;
    for (var T in _) if (w.call(_, T)) return !1;
    return !0;
  }
  return (Tp = S), Tp;
}
var aT = oT();
const Vn = ut(aT);
var Rp, w_;
function sT() {
  if (w_) return Rp;
  w_ = 1;
  var i = d1(),
    r = yl();
  function n(o, a) {
    return o && i(o, a, r);
  }
  return (Rp = n), Rp;
}
var Ip, __;
function lT() {
  if (__) return Ip;
  __ = 1;
  var i = go();
  function r(n, o) {
    return function (a, l) {
      if (a == null) return a;
      if (!i(a)) return n(a, l);
      for (var c = a.length, d = o ? c : -1, h = Object(a); (o ? d-- : ++d < c) && l(h[d], d, h) !== !1; );
      return a;
    };
  }
  return (Ip = r), Ip;
}
var Np, S_;
function uT() {
  if (S_) return Np;
  S_ = 1;
  var i = sT(),
    r = lT(),
    n = r(i);
  return (Np = n), Np;
}
var kp, E_;
function h1() {
  if (E_) return kp;
  E_ = 1;
  var i = jh();
  function r(n) {
    return typeof n == 'function' ? n : i;
  }
  return (kp = r), kp;
}
var Ap, b_;
function cT() {
  if (b_) return Ap;
  b_ = 1;
  var i = US(),
    r = uT(),
    n = h1(),
    o = ir();
  function a(l, c) {
    var d = o(l) ? i : r;
    return d(l, n(c));
  }
  return (Ap = a), Ap;
}
var Lp, C_;
function dT() {
  return C_ || ((C_ = 1), (Lp = cT())), Lp;
}
var fT = dT();
const pT = ut(fT);
function _a(i, r) {
  i && console.warn(`Warning: ${r}`);
}
function en(i) {
  return i == null;
}
class hT {
  constructor() {
    this._eventMap = new Map();
  }
  on(r, n) {
    return (
      r &&
        typeof n == 'function' &&
        (this._eventMap.has(r) || this._eventMap.set(r, []), this._eventMap.get(r).push(n)),
      this
    );
  }
  once(r, n) {
    var o = this;
    if (r && typeof n == 'function') {
      const a = function () {
        n(...arguments), o.off(r, a);
      };
      this.on(r, a);
    }
  }
  off(r, n) {
    if (r)
      if (typeof n == 'function') {
        const o = this._eventMap.get(r);
        if (Array.isArray(o) && o.length) {
          let a = -1;
          for (; (a = o.findIndex(l => l === n)) > -1; ) o.splice(a, 1);
        }
      } else en(n) && this._eventMap.delete(r);
    return this;
  }
  emit(r) {
    for (var n = arguments.length, o = new Array(n > 1 ? n - 1 : 0), a = 1; a < n; a++) o[a - 1] = arguments[a];
    return this._eventMap.has(r) ? ([...this._eventMap.get(r)].forEach(c => c(...o)), !0) : !1;
  }
}
function ha(i) {
  try {
    return i instanceof HTMLElement;
  } catch {
    return typeof i == 'object' && i.nodeType === 1 && typeof i.style == 'object' && typeof i.ownerDocument == 'object';
  }
}
function mT(i) {
  if (i && typeof i == 'object')
    return typeof i.toJSON == 'function'
      ? i.toJSON()
      : ['left', 'top', 'right', 'bottom', 'width', 'height'].reduce((n, o) => ((n[o] = i[o]), n), {});
}
function ao(i) {
  i.stopPropagation(), i.preventDefault();
}
function gT(i) {
  return i.length === 1 && i.match(/\S/);
}
function ka(i, r) {
  for (let n = 0; n < i.length; n++) i[n] === r ? ((i[n].tabIndex = 0), i[n].focus()) : (i[n].tabIndex = -1);
}
function yT(i) {
  i.length > 0 && ka(i, i[0]);
}
function vT(i) {
  i.length > 0 && ka(i, i[i.length - 1]);
}
function wT(i, r) {
  let n, o;
  i.length > 0 && (r === i[0] ? (n = i[i.length - 1]) : ((o = i.indexOf(r)), (n = i[o - 1])), ka(i, n));
}
function _T(i, r) {
  let n, o;
  i.length > 0 && (r === i[i.length - 1] ? (n = i[0]) : ((o = i.indexOf(r)), (n = i[o + 1])), ka(i, n));
}
function ST(i, r, n, o) {
  let a, l;
  return !i || !n || !o || o.length > 1
    ? -1
    : ((o = o.toLowerCase()),
      (a = i.indexOf(r) + 1),
      a >= i.length && (a = 0),
      (l = n.indexOf(o, a)),
      l === -1 && (l = n.indexOf(o, 0)),
      l >= 0 ? l : -1);
}
function ET(i, r) {
  if (!i) return null;
  for (; i.parentElement && De(i.parentElement, 'attributes.role.value', '') !== r; ) i = i.parentElement;
  return i.parentElement;
}
function bT(i, r) {
  for (let n = 0; n < i.length; n++) {
    const o = i[n].attributes['data-popupid'];
    if (o && o.value === r) return i[n];
  }
  return null;
}
const Gs = { TOP: /top/i, RIGHT: /right/i, BOTTOM: /bottom/i, LEFT: /left/i },
  Zi = { left: 0, top: 0, height: 0, width: 0, scrollLeft: 0, scrollTop: 0 };
let CT = class extends nn {
  constructor(r) {
    var n;
    super(Object.assign({}, r)),
      (n = this),
      (this.removePortal = () => {
        this._adapter.removePortal();
      }),
      (this.setDisplayNone = (o, a) => {
        this._adapter.setDisplayNone(o, a);
      }),
      (this.updateStateIfCursorOnTrigger = o => {
        var a, l;
        if (!((a = o?.matches) === null || a === void 0) && a.call(o, ':hover')) {
          const c = this._adapter.getEventName(),
            d = this.getState('triggerEventSet');
          (l = d[c.mouseEnter]) === null || l === void 0 || l.call(d);
        }
      }),
      (this.onResize = () => {
        this.getState('visible') && this.calcPosition();
      }),
      (this.delayShow = () => {
        const o = this.getProp('mouseEnterDelay');
        this.clearDelayTimer(),
          o > 0
            ? (this._timer = setTimeout(() => {
                this.show(), this.clearDelayTimer();
              }, o))
            : this.show();
      }),
      (this.show = () => {
        if ((this._initContainerPosition(), this._adapter.getAnimatingState())) return;
        const o = this.getProp('content'),
          a = this.getProp('trigger'),
          l = this.getProp('clickTriggerToHide'),
          { visible: c, displayNone: d } = this.getStates();
        if ((d && this.setDisplayNone(!1), !c)) {
          if (
            (this.clearDelayTimer(),
            this._adapter.on('portalInserted', () => {
              this.calcPosition();
            }),
            a === 'hover')
          ) {
            const h = () => {
              var g;
              const y = this._adapter.getTriggerDOM();
              a && !(!((g = y?.matches) === null || g === void 0) && g.call(y, ':hover')) && this.hide(),
                this._adapter.off('portalInserted', h);
            };
            this._adapter.on('portalInserted', h);
          }
          this._adapter.on('positionUpdated', () => {
            this._togglePortalVisible(!0);
          }),
            this._adapter.insertPortal(o, { left: -9999, top: -9999 }),
            a === 'custom' && this._adapter.registerClickOutsideHandler(() => {}),
            (a === 'click' || l || a === 'contextMenu') && this._adapter.registerClickOutsideHandler(this.hide),
            this._bindScrollEvent(),
            this._bindResizeEvent();
        }
      }),
      (this.calcPosition = function (o, a, l) {
        let c = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : !0;
        (o = (Vn(o) ? n._adapter.getTriggerBounding() : o) || Object.assign({}, Zi)),
          (l = (Vn(l) ? n._adapter.getPopupContainerRect() : l) || Object.assign({}, Zi)),
          (a = (Vn(a) ? n._adapter.getWrapperBounding() : a) || Object.assign({}, Zi));
        let d = n.calcPosStyle({ triggerRect: o, wrapperRect: a, containerRect: l }),
          h = n.getProp('position');
        if (n.getProp('autoAdjustOverflow')) {
          const { position: g, isHeightOverFlow: y, isWidthOverFlow: w } = n.adjustPosIfNeed(h, d, o, a, l);
          (h !== g || y || w) &&
            ((h = g),
            (d = n.calcPosStyle({
              triggerRect: o,
              wrapperRect: a,
              containerRect: l,
              position: h,
              spacing: null,
              isOverFlow: [y, w],
            })));
        }
        return c && n._mounted && n._adapter.setPosition(Object.assign(Object.assign({}, d), { position: h })), d;
      }),
      (this.delayHide = () => {
        const o = this.getProp('mouseLeaveDelay');
        this.clearDelayTimer(),
          o > 0
            ? (this._timer = setTimeout(() => {
                this.hide(), this.clearDelayTimer();
              }, o))
            : this.hide();
      }),
      (this.hide = () => {
        this.clearDelayTimer(),
          this._togglePortalVisible(!1),
          this._adapter.off('portalInserted'),
          this._adapter.off('positionUpdated');
      }),
      (this.handleContainerKeydown = o => {
        const { guardFocus: a, closeOnEsc: l } = this.getProps();
        switch (o && o.key) {
          case 'Escape':
            l && this._handleEscKeyDown(o);
            break;
          case 'Tab':
            if (a) {
              const c = this._adapter.getContainer(),
                d = this._adapter.getFocusableElements(c);
              d.length &&
                (o.shiftKey ? this._handleContainerShiftTabKeyDown(d, o) : this._handleContainerTabKeyDown(d, o));
            }
            break;
        }
      }),
      (this._timer = null);
  }
  init() {
    const { wrapperId: r } = this.getProps();
    (this._mounted = !0), this._bindEvent(), this._shouldShow(), r || this._adapter.setId();
  }
  destroy() {
    (this._mounted = !1), this.unBindEvent();
  }
  _bindEvent() {
    const r = this.getProp('trigger'),
      { triggerEventSet: n, portalEventSet: o } = this._generateEvent(r);
    this._bindTriggerEvent(n), this._bindPortalEvent(o), this._bindResizeEvent();
  }
  unBindEvent() {
    this._adapter.unregisterClickOutsideHandler(),
      this.unBindResizeEvent(),
      this.unBindScrollEvent(),
      clearTimeout(this._timer);
  }
  _bindTriggerEvent(r) {
    this._adapter.registerTriggerEvent(r);
  }
  _bindPortalEvent(r) {
    this._adapter.registerPortalEvent(r);
  }
  _bindResizeEvent() {
    this._adapter.registerResizeHandler(this.onResize);
  }
  unBindResizeEvent() {
    this._adapter.unregisterResizeHandler(this.onResize);
  }
  _adjustPos() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : '',
      n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !1,
      o = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'reverse',
      a = arguments.length > 3 ? arguments[3] : void 0;
    switch (o) {
      case 'reverse':
        return this._reversePos(r, n);
      case 'expand':
        return this._expandPos(r, a);
      case 'reduce':
        return this._reducePos(r);
      default:
        return this._reversePos(r, n);
    }
  }
  _reversePos() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : '';
    if (arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !1) {
      if (Gs.TOP.test(r)) return r.replace('top', 'bottom').replace('Top', 'Bottom');
      if (Gs.BOTTOM.test(r)) return r.replace('bottom', 'top').replace('Bottom', 'Top');
    } else {
      if (Gs.LEFT.test(r)) return r.replace('left', 'right').replace('Left', 'Right');
      if (Gs.RIGHT.test(r)) return r.replace('right', 'left').replace('Right', 'Left');
    }
    return r;
  }
  _expandPos() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : '',
      n = arguments.length > 1 ? arguments[1] : void 0;
    return r.concat(n);
  }
  _reducePos() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : '';
    const n = ['Top', 'Bottom', 'Left', 'Right'].find(o => r.endsWith(o));
    return n ? r.replace(n, '') : r;
  }
  clearDelayTimer() {
    this._timer && (clearTimeout(this._timer), (this._timer = null));
  }
  _generateEvent(r) {
    const n = this._adapter.getEventName(),
      o = {
        [n.keydown]: l => {
          this._handleTriggerKeydown(l);
        },
      };
    let a = {};
    switch (r) {
      case 'focus':
        (o[n.focus] = () => {
          this.delayShow();
        }),
          (o[n.blur] = () => {
            this.delayHide();
          }),
          (a = o);
        break;
      case 'click':
        (o[n.click] = () => {
          this.show();
        }),
          (a = {});
        break;
      case 'hover':
        (o[n.mouseEnter] = () => {
          this.setCache('isClickToHide', !1), this.delayShow();
        }),
          (o[n.mouseLeave] = () => {
            this.delayHide();
          }),
          (o[n.focus] = () => {
            const { disableFocusListener: l } = this.getProps();
            !l && this.delayShow();
          }),
          (o[n.blur] = () => {
            const { disableFocusListener: l } = this.getProps();
            !l && this.delayHide();
          }),
          (a = Object.assign({}, o)),
          this.getProp('clickToHide') &&
            ((a[n.click] = () => {
              this.setCache('isClickToHide', !0), this.hide();
            }),
            (a[n.mouseEnter] = () => {
              this.getCache('isClickToHide') || this.delayShow();
            }));
        break;
      case 'custom':
        break;
      case 'contextMenu':
        o[n.contextMenu] = l => {
          l.preventDefault(), this.show();
        };
        break;
    }
    return { triggerEventSet: o, portalEventSet: a };
  }
  _shouldShow() {
    this.getProp('visible') && this.show();
  }
  _togglePortalVisible(r) {
    const n = this.getState('visible'),
      o = this.getState('isInsert');
    (n !== r || o !== r) &&
      this._adapter.togglePortalVisible(r, () => {
        r && this._adapter.setInitialFocus(), this._adapter.notifyVisibleChange(r);
      });
  }
  _roundPixel(r) {
    return typeof r == 'number' ? Math.round(r) : r;
  }
  calcTransformOrigin(r, n, o, a) {
    if (r && n && o != null && a != null) {
      if (this.getProp('transformFromCenter')) {
        if (['topLeft', 'bottomLeft'].includes(r)) return `${this._roundPixel(n.width / 2)}px ${-a * 100}%`;
        if (['topRight', 'bottomRight'].includes(r))
          return `calc(100% - ${this._roundPixel(n.width / 2)}px) ${-a * 100}%`;
        if (['leftTop', 'rightTop'].includes(r)) return `${-o * 100}% ${this._roundPixel(n.height / 2)}px`;
        if (['leftBottom', 'rightBottom'].includes(r))
          return `${-o * 100}% calc(100% - ${this._roundPixel(n.height / 2)}px)`;
      }
      return `${-o * 100}% ${-a * 100}%`;
    }
    return null;
  }
  calcPosStyle(r) {
    var n;
    const { spacing: o, isOverFlow: a } = r,
      { innerWidth: l } = window,
      c = (Vn(r.triggerRect) ? r.triggerRect : this._adapter.getTriggerBounding()) || Object.assign({}, Zi),
      d = (Vn(r.containerRect) ? r.containerRect : this._adapter.getPopupContainerRect()) || Object.assign({}, Zi),
      h = (Vn(r.wrapperRect) ? r.wrapperRect : this._adapter.getWrapperBounding()) || Object.assign({}, Zi),
      g = r.position != null ? r.position : this.getProp('position'),
      y = o ?? this.getProp('spacing'),
      { arrowPointAtCenter: w, showArrow: S, arrowBounding: _ } = this.getProps(),
      x = S && w;
    let T = y,
      O = 0;
    if (typeof y != 'number') {
      const ke = g.includes('top') || g.includes('bottom');
      (T = ke ? y.y : y.x), (O = ke ? y.x : y.y);
    }
    const L = De(_, 'width', 24),
      I = De(_, 'width', 24),
      $ = De(_, 'offsetY', 0),
      H = 6,
      V = 6;
    let F,
      b,
      q = 0,
      W = 0;
    const X = c.left + c.width / 2,
      G = c.top + c.height / 2,
      oe = H + L / 2,
      ie = V + I / 2,
      fe = h.height - d.height,
      me = h.width - d.width,
      be = fe > 0 ? fe : 0,
      Te = me > 0 ? me : 0,
      U = a && a[0],
      te = a && a[1],
      ee = X - d.left < d.right - X,
      k = G - d.top < d.bottom - G,
      K = h.width > l,
      le =
        Math.abs(h?.width - ((n = this._adapter.getContainer()) === null || n === void 0 ? void 0 : n.clientWidth)) > 1;
    switch ((le && (T = (T * h.width) / this._adapter.getContainer().clientWidth), g)) {
      case 'top':
        (F = te ? (ee ? d.left + h.width / 2 : d.right - h.width / 2 + Te) : X + O),
          (b = U ? d.bottom + be : c.top - T),
          (q = -0.5),
          (W = -1);
        break;
      case 'topLeft':
        (F = te ? (K ? d.left : d.right - h.width) : x ? X - oe + O : c.left + O),
          (b = U ? d.bottom + be : c.top - T),
          (W = -1);
        break;
      case 'topRight':
        (F = te ? d.right + Te : x ? X + oe + O : c.right + O), (b = U ? d.bottom + be : c.top - T), (W = -1), (q = -1);
        break;
      case 'left':
        (F = te ? d.right + Te - T + oe : c.left - T),
          (b = U ? (k ? d.top + h.height / 2 : d.bottom - h.height / 2 + be) : G + O),
          (q = -1),
          (W = -0.5);
        break;
      case 'leftTop':
        (F = te ? d.right + Te - T + oe : c.left - T), (b = U ? d.top : x ? G - ie + O : c.top + O), (q = -1);
        break;
      case 'leftBottom':
        (F = te ? d.right + Te - T + oe : c.left - T),
          (b = U ? d.bottom + be : x ? G + ie + O : c.bottom + O),
          (q = -1),
          (W = -1);
        break;
      case 'bottom':
        (F = te ? (ee ? d.left + h.width / 2 : d.right - h.width / 2 + Te) : X + O),
          (b = U ? d.top + ie - T : c.top + c.height + T),
          (q = -0.5);
        break;
      case 'bottomLeft':
        (F = te ? (K ? d.left : d.right - h.width) : x ? X - oe + O : c.left + O),
          (b = U ? d.top + ie - T : c.top + c.height + T);
        break;
      case 'bottomRight':
        (F = te ? d.right + Te : x ? X + oe + O : c.right + O),
          (b = U ? d.top + ie - T : c.top + c.height + T),
          (q = -1);
        break;
      case 'right':
        (F = te ? d.left - T + oe : c.right + T),
          (b = U ? (k ? d.top + h.height / 2 : d.bottom - h.height / 2 + be) : G + O),
          (W = -0.5);
        break;
      case 'rightTop':
        (F = te ? d.left - T + oe : c.right + T), (b = U ? d.top : x ? G - ie + O : c.top + O);
        break;
      case 'rightBottom':
        (F = te ? d.left - T + oe : c.right + T), (b = U ? d.bottom + be : x ? G + ie + O : c.bottom + O), (W = -1);
        break;
      case 'leftTopOver':
        (F = c.left - T), (b = c.top - T);
        break;
      case 'rightTopOver':
        (F = c.right + T), (b = c.top - T), (q = -1);
        break;
      case 'leftBottomOver':
        (F = c.left - T), (b = c.bottom + T), (W = -1);
        break;
      case 'rightBottomOver':
        (F = c.right + T), (b = c.bottom + T), (q = -1), (W = -1);
        break;
    }
    const se = this.calcTransformOrigin(g, c, q, W),
      pe = this._adapter.containerIsBody();
    if (
      ((F = F - d.left),
      (b = b - d.top),
      le && (F /= h.width / this._adapter.getContainer().clientWidth),
      le && (b /= h.height / this._adapter.getContainer().clientHeight),
      pe && !this._adapter.containerIsRelativeOrAbsolute())
    ) {
      const ke = this._adapter.getDocumentElementBounding();
      (F += d.left - ke.left), (b += d.top - ke.top);
    }
    (F = pe ? F : F + d.scrollLeft), (b = pe ? b : b + d.scrollTop);
    const Ce = c.height;
    if (this.getProp('showArrow') && !w && Ce <= (I / 2 + $) * 2) {
      const ke = Ce / 2 - ($ + I / 2);
      (g.includes('Top') || g.includes('Bottom')) && !g.includes('Over') && (b = g.includes('Top') ? b + ke : b - ke);
    }
    const Ne = { left: this._roundPixel(F), top: this._roundPixel(b) };
    let Re = '';
    return (
      q != null &&
        ((Re += `translateX(${q * 100}%) `), Object.defineProperty(Ne, 'translateX', { enumerable: !1, value: q })),
      W != null &&
        ((Re += `translateY(${W * 100}%) `), Object.defineProperty(Ne, 'translateY', { enumerable: !1, value: W })),
      se != null && (Ne.transformOrigin = se),
      Re && (Ne.transform = Re),
      Ne
    );
  }
  isLR() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : '';
    return r.includes('left') || r.includes('right');
  }
  isTB() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : '';
    return r.includes('top') || r.includes('bottom');
  }
  isReverse(r, n, o) {
    return r < o && n > o;
  }
  isOverFlow(r, n, o) {
    return r < o && n < o;
  }
  isHalfOverFlow(r, n, o) {
    return r < o || n < o;
  }
  isHalfAllEnough(r, n, o) {
    return r >= o || n >= o;
  }
  getReverse(r, n, o, a) {
    return (r && a) || o;
  }
  adjustPosIfNeed(r, n, o, a, l) {
    const { innerWidth: c, innerHeight: d } = window,
      { margin: h } = this.getProps(),
      g = typeof h == 'number' ? h : h.marginLeft,
      y = typeof h == 'number' ? h : h.marginTop,
      w = typeof h == 'number' ? h : h.marginRight,
      S = typeof h == 'number' ? h : h.marginBottom;
    let _ = !1,
      x = !1;
    const T = this.getProp('spacing');
    let O = T,
      L = 0;
    if (typeof T != 'number') {
      const I = r.includes('top') || r.includes('bottom');
      (O = I ? T.y : T.x), (L = I ? T.x : T.y);
    }
    if (a.width > 0 && a.height > 0) {
      const I = o.left,
        $ = o.right,
        H = o.top,
        V = o.bottom,
        F = c - I,
        b = d - H,
        q = c - $,
        W = d - V,
        X = a.width > o.width,
        G = a.height > o.height,
        oe = H - y < a.height + O && W - S > a.height + O,
        ie = I - g < a.width + O && q - w > a.width + O,
        fe = W - S < a.height + O && H - y > a.height + O,
        me = q - w < a.width + O && I - g > a.width + O;
      b - S < a.height + O && V - y > a.height + O, V - y < a.height + O && b - S > a.height + O;
      const be = b < a.height + L && V > a.height + L,
        Te = V < a.height + L && b > a.height + L,
        U = F < a.width + L && $ > a.width + L,
        te = $ < a.width + L && F > a.width + L,
        ee = b < a.height + O && V > a.height + O,
        k = V < a.height + O && b > a.height + O,
        K = F < a.width && $ > a.width,
        le = $ < a.width && F > a.width,
        se = H - l.top,
        pe = I - l.left,
        Ce = se + o.height,
        Ne = pe + o.width,
        Re = l.bottom - V,
        ke = l.right - $,
        Ze = Re + o.height,
        Xt = ke + o.width,
        it = this.isReverse(se - y, Re - S, a.height + O),
        Bt = this.isReverse(pe - g, ke - w, a.width + O),
        Ur = this.isReverse(Re - S, se - y, a.height + O),
        qe = this.isReverse(ke - w, pe - g, a.width + O);
      this.isReverse(Ze - S, Ce - y, a.height + O), this.isReverse(Ce - y, Ze - S, a.height + O);
      const Tt = this.isReverse(Ze, Ce, a.height + L),
        je = this.isReverse(Ce, Ze, a.height + L),
        or = this.isReverse(Xt, Ne, a.width + L),
        Ut = this.isReverse(Ne, Xt, a.width + L),
        St = o.height / 2,
        ct = o.width / 2,
        Et = this.isOverFlow(H - y, W - S, a.height + O),
        ot = this.isOverFlow(I - g, q - w, a.width + O),
        vt = this.isOverFlow(V - y, b - S, a.height + O),
        Rt = this.isOverFlow($ - g, F - w, a.width + O),
        Hr = this.isHalfOverFlow(V - St, b - St, (a.height + L) / 2),
        ar = this.isHalfOverFlow($ - ct, F - ct, (a.width + L) / 2),
        Ye = this.isHalfAllEnough(V - St, b - St, (a.height + L) / 2),
        mt = this.isHalfAllEnough($ - ct, F - ct, (a.width + L) / 2),
        Ht = this.isOverFlow(se - y, Re - S, a.height + O),
        sr = this.isOverFlow(pe - g, ke - w, a.width + O),
        mr = this.isOverFlow(Ce - y, Ze - S, a.height + O),
        It = this.isOverFlow(Ne - g, Xt - w, a.width + O),
        at = this.isHalfOverFlow(Ce - St, Ze - St, (a.height + L) / 2),
        ti = this.isHalfOverFlow(Ne - ct, Xt - ct, (a.width + L) / 2),
        Ir = this.isHalfAllEnough(Ce - St, Ze - St, (a.height + L) / 2),
        Nr = this.isHalfAllEnough(Ne - ct, Xt - ct, (a.width + L) / 2),
        on = this.getReverse(Et, Ht, oe, it),
        Kr = this.getReverse(ot, sr, ie, Bt),
        gr = this.getReverse(Et, Ht, fe, Ur),
        lr = this.getReverse(ot, sr, me, qe),
        Nt = this.getReverse(vt, mr, be, Tt),
        an = this.getReverse(vt, mr, Te, je),
        yr = this.getReverse(Rt, It, U, or),
        sn = this.getReverse(Rt, It, te, Ut),
        bn = Hr && at,
        Vr = ar && ti;
      switch (r) {
        case 'top':
          on && (r = this._adjustPos(r, !0)),
            Vr && (yr || sn) && (r = this._adjustPos(r, !0, 'expand', yr ? 'Right' : 'Left'));
          break;
        case 'topLeft':
          on && (r = this._adjustPos(r, !0)),
            yr && X && (r = this._adjustPos(r)),
            x && (mt || Nr) && (r = this._adjustPos(r, !0, 'reduce'));
          break;
        case 'topRight':
          on && (r = this._adjustPos(r, !0)),
            sn && X && (r = this._adjustPos(r)),
            x && (mt || Nr) && (r = this._adjustPos(r, !0, 'reduce'));
          break;
        case 'left':
          Kr && (r = this._adjustPos(r)),
            bn && (Nt || an) && (r = this._adjustPos(r, !1, 'expand', Nt ? 'Bottom' : 'Top'));
          break;
        case 'leftTop':
          Kr && (r = this._adjustPos(r)),
            Nt && G && (r = this._adjustPos(r, !0)),
            _ && (Ye || Ir) && (r = this._adjustPos(r, !1, 'reduce'));
          break;
        case 'leftBottom':
          Kr && (r = this._adjustPos(r)),
            an && G && (r = this._adjustPos(r, !0)),
            _ && (Ye || Ir) && (r = this._adjustPos(r, !1, 'reduce'));
          break;
        case 'bottom':
          gr && (r = this._adjustPos(r, !0)),
            Vr && (yr || sn) && (r = this._adjustPos(r, !0, 'expand', yr ? 'Right' : 'Left'));
          break;
        case 'bottomLeft':
          gr && (r = this._adjustPos(r, !0)),
            yr && X && (r = this._adjustPos(r)),
            x && (mt || Nr) && (r = this._adjustPos(r, !0, 'reduce'));
          break;
        case 'bottomRight':
          gr && (r = this._adjustPos(r, !0)),
            sn && X && (r = this._adjustPos(r)),
            x && (mt || Nr) && (r = this._adjustPos(r, !0, 'reduce'));
          break;
        case 'right':
          lr && (r = this._adjustPos(r)),
            bn && (Nt || an) && (r = this._adjustPos(r, !1, 'expand', Nt ? 'Bottom' : 'Top'));
          break;
        case 'rightTop':
          lr && (r = this._adjustPos(r)),
            Nt && G && (r = this._adjustPos(r, !0)),
            _ && (Ye || Ir) && (r = this._adjustPos(r, !1, 'reduce'));
          break;
        case 'rightBottom':
          lr && (r = this._adjustPos(r)),
            an && G && (r = this._adjustPos(r, !0)),
            _ && (Ye || Ir) && (r = this._adjustPos(r, !1, 'reduce'));
          break;
        case 'leftTopOver':
          ee && (r = this._adjustPos(r, !0)), K && (r = this._adjustPos(r));
          break;
        case 'leftBottomOver':
          k && (r = this._adjustPos(r, !0)), K && (r = this._adjustPos(r));
          break;
        case 'rightTopOver':
          ee && (r = this._adjustPos(r, !0)), le && (r = this._adjustPos(r));
          break;
        case 'rightBottomOver':
          k && (r = this._adjustPos(r, !0)), le && (r = this._adjustPos(r));
          break;
      }
      this.isTB(r) &&
        ((_ = Et && Ht),
        r === 'top' || r === 'bottom' ? (x = (ar && ti) || $ < 0 || q < 0) : (x = (Rt && It) || $ < 0 || q < 0)),
        this.isLR(r) &&
          ((x = ot && sr),
          r === 'left' || r === 'right' ? (_ = (Hr && at) || H < 0 || b < 0) : (_ = (vt && mr) || H < 0 || b < 0));
    }
    return { position: r, isHeightOverFlow: _, isWidthOverFlow: x };
  }
  _bindScrollEvent() {
    this._adapter.registerScrollHandler(() => this.calcPosition());
  }
  unBindScrollEvent() {
    this._adapter.unregisterScrollHandler();
  }
  _initContainerPosition() {
    this._adapter.getContainerPosition() || !this._adapter.containerIsBody() || this._adapter.updateContainerPosition();
  }
  _handleTriggerKeydown(r) {
    const { closeOnEsc: n, disableArrowKeyDown: o } = this.getProps(),
      a = this._adapter.getContainer(),
      l = this._adapter.getFocusableElements(a),
      c = l.length;
    switch (r && r.key) {
      case 'Escape':
        ao(r), n && this._handleEscKeyDown(r);
        break;
      case 'ArrowUp':
        !o && c && this._handleTriggerArrowUpKeydown(l, r);
        break;
      case 'ArrowDown':
        !o && c && this._handleTriggerArrowDownKeydown(l, r);
        break;
    }
  }
  focusTrigger() {
    const { trigger: r, returnFocusOnClose: n, preventScroll: o } = this.getProps();
    if (n && r !== 'custom') {
      const a = this._adapter.getTriggerNode();
      a && 'focus' in a && a.focus({ preventScroll: o });
    }
  }
  _handleEscKeyDown(r) {
    const { trigger: n } = this.getProps();
    n !== 'custom' && (this.focusTrigger(), this.hide()), this._adapter.notifyEscKeydown(r);
  }
  _handleContainerTabKeyDown(r, n) {
    const { preventScroll: o } = this.getProps(),
      a = this._adapter.getActiveElement();
    r[r.length - 1] === a && (r[0].focus({ preventScroll: o }), n.preventDefault());
  }
  _handleContainerShiftTabKeyDown(r, n) {
    const { preventScroll: o } = this.getProps(),
      a = this._adapter.getActiveElement();
    r[0] === a && (r[r.length - 1].focus({ preventScroll: o }), n.preventDefault());
  }
  _handleTriggerArrowDownKeydown(r, n) {
    const { preventScroll: o } = this.getProps();
    r[0].focus({ preventScroll: o }), n.preventDefault();
  }
  _handleTriggerArrowUpKeydown(r, n) {
    const { preventScroll: o } = this.getProps();
    r[r.length - 1].focus({ preventScroll: o }), n.preventDefault();
  }
};
const OT = { PREFIX: `${nr}-tooltip` },
  io = {
    POSITION_SET: [
      'top',
      'topLeft',
      'topRight',
      'left',
      'leftTop',
      'leftBottom',
      'right',
      'rightTop',
      'rightBottom',
      'bottom',
      'bottomLeft',
      'bottomRight',
      'leftTopOver',
      'rightTopOver',
      'leftBottomOver',
      'rightBottomOver',
    ],
    TRIGGER_SET: ['hover', 'focus', 'click', 'custom', 'contextMenu'],
    STATUS_DISABLED: 'disabled',
    STATUS_LOADING: 'loading',
  },
  Wn = {
    ARROW_BOUNDING: { offsetX: 0, offsetY: 2, width: 24, height: 7 },
    DEFAULT_Z_INDEX: 1060,
    MOUSE_ENTER_DELAY: 50,
    MOUSE_LEAVE_DELAY: 50,
    SPACING: 8,
    MARGIN: 0,
  };
function m1() {
  let i = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const { prefix: r = '', length: n = 7 } = i,
    o = '0123456789abcdefghijklmnopqrstuvwxyz',
    a = o.length;
  let l = '';
  for (let c = 0; c < n; c++) {
    const d = Math.floor(Math.random() * a);
    l += o.charAt(d);
  }
  return r ? `${r}-${l}` : l;
}
var jp, O_;
function g1() {
  if (O_) return jp;
  O_ = 1;
  var i = Ph(),
    r = ho(),
    n = hl(),
    o = Tr(),
    a = pl();
  function l(c, d, h, g) {
    if (!o(c)) return c;
    d = r(d, c);
    for (var y = -1, w = d.length, S = w - 1, _ = c; _ != null && ++y < w; ) {
      var x = a(d[y]),
        T = h;
      if (x === '__proto__' || x === 'constructor' || x === 'prototype') return c;
      if (y != S) {
        var O = _[x];
        (T = g ? g(O, x, _) : void 0), T === void 0 && (T = o(O) ? O : n(d[y + 1]) ? [] : {});
      }
      i(_, x, T), (_ = _[x]);
    }
    return c;
  }
  return (jp = l), jp;
}
var Dp, x_;
function xT() {
  if (x_) return Dp;
  x_ = 1;
  var i = g1();
  function r(n, o, a) {
    return n == null ? n : i(n, o, a);
  }
  return (Dp = r), Dp;
}
var PT = xT();
const TT = ut(PT);
var Mp, P_;
function RT() {
  if (P_) return Mp;
  P_ = 1;
  var i = o1(),
    r = 1,
    n = 4;
  function o(a, l) {
    return (l = typeof l == 'function' ? l : void 0), i(a, r | n, l);
  }
  return (Mp = o), Mp;
}
var IT = RT();
const NT = ut(IT);
class kT {
  constructor() {
    this.config = {};
  }
}
const el = new kT();
var T_ = function (i, r, n, o) {
  function a(l) {
    return l instanceof n
      ? l
      : new n(function (c) {
          c(l);
        });
  }
  return new (n || (n = Promise))(function (l, c) {
    function d(y) {
      try {
        g(o.next(y));
      } catch (w) {
        c(w);
      }
    }
    function h(y) {
      try {
        g(o.throw(y));
      } catch (w) {
        c(w);
      }
    }
    function g(y) {
      y.done ? l(y.value) : a(y.value).then(d, h);
    }
    g((o = o.apply(i, r || [])).next());
  });
};
function Xs(i, r) {
  i && typeof i.stopPropagation == 'function' && i.stopPropagation(),
    i.nativeEvent &&
      typeof i.nativeEvent.stopImmediatePropagation == 'function' &&
      i.nativeEvent.stopImmediatePropagation();
}
function AT(i, r) {
  return NT(i, n => {
    if (typeof r == 'function') return r(n);
    if (typeof n == 'function' || E.isValidElement(n) || Object.prototype.toString.call(n) === '[object Error]')
      return n;
    if (Array.isArray(n) && n.length === 0) {
      const o = Object.keys(n);
      if (o.length) {
        const a = [];
        o.forEach(l => {
          TT(a, l, n[l]);
        });
        try {
          _a(
            De(process, 'env.NODE_ENV') !== 'production',
            `[Semi] You may use an out-of-bounds array. In some cases, your program may not behave as expected.
                    The maximum length of an array is 4294967295.
                    Please check whether the array subscript in your data exceeds the maximum value of the JS array subscript`
          );
        } catch {}
        return a;
      } else return;
    }
  });
}
const y1 = i => E.isValidElement(i) && De(i.type, 'elementType') === 'Icon';
function LT() {
  return document ? document.activeElement : null;
}
function jT(i) {
  if (!ha(i)) return [];
  const n = [
    "input:not([disabled]):not([tabindex='-1'])",
    "textarea:not([disabled]):not([tabindex='-1'])",
    "button:not([disabled]):not([tabindex='-1'])",
    "a[href]:not([tabindex='-1'])",
    "select:not([disabled]):not([tabindex='-1'])",
    "area[href]:not([tabindex='-1'])",
    "iframe:not([tabindex='-1'])",
    "object:not([tabindex='-1'])",
    "*[tabindex]:not([tabindex='-1'])",
    "*[contenteditable]:not([tabindex='-1'])",
  ].join(',');
  return Array.from(i.querySelectorAll(n));
}
function Mh(i, r) {
  return T_(this, void 0, void 0, function* () {
    if (r === 0) {
      yield i();
      return;
    } else {
      yield new Promise(n => {
        setTimeout(
          () =>
            T_(this, void 0, void 0, function* () {
              yield Mh(i, r - 1), n();
            }),
          0
        );
      });
      return;
    }
  });
}
function Pi(i) {
  let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const n = () => {
    var o, a;
    return (
      ((a = (o = el?.config) === null || o === void 0 ? void 0 : o.overrideDefaultProps) === null || a === void 0
        ? void 0
        : a[i]) || {}
    );
  };
  return new Proxy(Object.assign({}, r), {
    get(o, a, l) {
      const c = n();
      return a in c ? c[a] : Reflect.get(o, a, l);
    },
    set(o, a, l, c) {
      return Reflect.set(o, a, l, c);
    },
    ownKeys() {
      const o = n();
      return Array.from(new Set([...Reflect.ownKeys(r), ...Object.keys(o)]));
    },
    getOwnPropertyDescriptor(o, a) {
      const l = n();
      return a in l ? Reflect.getOwnPropertyDescriptor(l, a) : Reflect.getOwnPropertyDescriptor(o, a);
    },
  });
}
const _l = E.createContext({}),
  DT = () => document.body;
class Sl extends A.PureComponent {
  constructor(r, n) {
    var o;
    super(r),
      (o = this),
      (this.initContainer = function (a) {
        let l = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !1;
        var c, d;
        try {
          let h;
          if (
            !o.el ||
            !(!((c = o.state) === null || c === void 0) && c.container) ||
            !Array.from(o.state.container.childNodes).includes(o.el)
          ) {
            o.el = document.createElement('div');
            const y = (o.props.getPopupContainer || a.getPopupContainer || DT)();
            return (
              y.appendChild(o.el),
              o.addStyle(o.props.style),
              o.addClass(o.props.prefixCls, a, o.props.className),
              (h = y),
              h
            );
          }
        } catch (h) {
          if (!l) throw h;
        }
        return (d = o.state) === null || d === void 0 ? void 0 : d.container;
      }),
      (this.addStyle = function () {
        let a = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        if (o.el) for (const l of Object.keys(a)) o.el.style[l] = a[l];
      }),
      (this.addClass = function (a) {
        let l = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : o.context;
        const { direction: c } = l;
        for (var d = arguments.length, h = new Array(d > 2 ? d - 2 : 0), g = 2; g < d; g++) h[g - 2] = arguments[g];
        const y = de(a, ...h, { [`${a}-rtl`]: c === 'rtl' });
        o.el && (o.el.className = y);
      }),
      (this.state = { container: this.initContainer(n, !0) });
  }
  componentDidMount() {
    const r = this.initContainer(this.context);
    r !== this.state.container && this.setState({ container: r });
  }
  componentDidUpdate(r) {
    const { didUpdate: n } = this.props;
    n && n(r);
  }
  componentWillUnmount() {
    const { container: r } = this.state;
    r && r.removeChild(this.el);
  }
  render() {
    const { state: r, props: n } = this;
    return r.container ? xa.createPortal(n.children, this.el) : null;
  }
}
Sl.contextType = _l;
Sl.defaultProps = { prefixCls: `${nr}-portal` };
Sl.propTypes = {
  children: m.node,
  prefixCls: m.string,
  getPopupContainer: m.func,
  className: m.string,
  didUpdate: m.func,
};
var MT = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const FT = i => {
  const { className: r, style: n } = i,
    o = MT(i, ['className', 'style']);
  return E.createElement(
    'svg',
    Object.assign({ 'aria-hidden': !0, className: r, style: n }, o, {
      width: '24',
      height: '7',
      viewBox: '0 0 24 7',
      fill: 'currentColor',
      xmlns: 'http://www.w3.org/2000/svg',
    }),
    E.createElement('path', { d: 'M24 0V1C20 1 18.5 2 16.5 4C14.5 6 14 7 12 7C10 7 9.5 6 7.5 4C5.5 2 4 1 0 1V0H24Z' })
  );
};
var $T = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const zT = i => {
    const { className: r, style: n } = i,
      o = $T(i, ['className', 'style']);
    return E.createElement(
      'svg',
      Object.assign({ 'aria-hidden': !0, className: r, style: n }, o, {
        width: '7',
        height: '24',
        xmlns: 'http://www.w3.org/2000/svg',
        fill: 'currentColor',
      }),
      E.createElement('path', { d: 'M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z' })
    );
  },
  qT = m.shape({ offsetX: m.number, offsetY: m.number, width: m.number, height: m.number });
class Fh extends E.Component {
  constructor(r) {
    super(r),
      (this.handleAnimationStart = () => {
        var n, o;
        (o = (n = this.props).onAnimationStart) === null || o === void 0 || o.call(n);
      }),
      (this.handleAnimationEnd = () => {
        this.setState(
          {
            currentClassName: this.props.endClassName,
            extraStyle: { animationFillMode: this.props.fillMode },
            isAnimating: !1,
          },
          () => {
            var n, o;
            (o = (n = this.props).onAnimationEnd) === null || o === void 0 || o.call(n, !1);
          }
        );
      }),
      (this.state = {
        currentClassName: this.props.startClassName,
        extraStyle: { animationFillMode: this.props.fillMode },
        isAnimating: !0,
      });
  }
  componentDidMount() {
    var r, n, o, a;
    (n = (r = this.props).onAnimationStart) === null || n === void 0 || n.call(r),
      this.props.motion ||
        ((a = (o = this.props).onAnimationEnd) === null || a === void 0 || a.call(o, !1),
        this.setState({ isAnimating: !1 }));
  }
  componentDidUpdate(r, n, o) {
    const a = Object.keys(this.props).filter(l => !oo(this.props[l], r[l]));
    a.includes('animationState'),
      (a.includes('startClassName') || a.includes('replayKey') || a.includes('motion')) &&
        this.setState(
          {
            currentClassName: this.props.startClassName,
            extraStyle: { animationFillMode: this.props.fillMode },
            isAnimating: !0,
          },
          () => {
            var l, c, d, h;
            (c = (l = this.props).onAnimationStart) === null || c === void 0 || c.call(l),
              this.props.motion ||
                ((h = (d = this.props).onAnimationEnd) === null || h === void 0 || h.call(d, this.state.isAnimating),
                this.setState({ isAnimating: !1 }));
          }
        );
  }
  render() {
    var r;
    return this.props.motion
      ? this.props.children({
          animationClassName: (r = this.state.currentClassName) !== null && r !== void 0 ? r : '',
          animationStyle: this.state.extraStyle,
          animationEventsNeedBind: {
            onAnimationStart: this.handleAnimationStart,
            onAnimationEnd: this.handleAnimationEnd,
          },
          isAnimating: this.state.isAnimating,
        })
      : this.props.children({
          animationClassName: '',
          animationStyle: {},
          animationEventsNeedBind: {},
          isAnimating: this.state.isAnimating,
        });
  }
}
Fh.defaultProps = { motion: !0, replayKey: '' };
var R_ = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const tl = OT.PREFIX,
  BT = io.POSITION_SET,
  UT = io.TRIGGER_SET,
  HT = ['flex', 'block', 'table', 'flow-root', 'grid'],
  KT = () => document.body;
class zr extends Rr {
  constructor(r) {
    super(r),
      (this.isAnimating = !1),
      (this.cachedLatestTransitionState = 'enter'),
      (this.setContainerEl = n => (this.containerEl = { current: n })),
      (this.isSpecial = n => {
        if (ha(n)) return !!n.disabled;
        if (A.isValidElement(n)) {
          if (De(n, 'props.disabled')) return io.STATUS_DISABLED;
          const a = De(n, 'props.loading'),
            l =
              !Vn(n) &&
              !Vn(n.type) &&
              (De(n, 'type.elementType') === 'Button' || De(n, 'type.elementType') === 'IconButton');
          if (a && l) return io.STATUS_LOADING;
        }
        return !1;
      }),
      (this.didLeave = () => {
        this.props.keepDOM ? this.foundation.setDisplayNone(!0) : this.foundation.removePortal(),
          this.foundation.unBindEvent();
      }),
      (this.renderIcon = () => {
        const { placement: n } = this.state,
          { showArrow: o, prefixCls: a, style: l } = this.props;
        let c = null;
        const d = de([`${a}-icon-arrow`]),
          h = De(l, 'backgroundColor'),
          g = n?.includes('left') || n?.includes('right') ? E.createElement(zT, null) : E.createElement(FT, null);
        return (
          o &&
            (A.isValidElement(o)
              ? (c = o)
              : (c = E.cloneElement(g, { className: d, style: { color: h, fill: 'currentColor' } }))),
          c
        );
      }),
      (this.handlePortalInnerClick = n => {
        this.props.clickToHide && this.foundation.hide(), this.props.stopPropagation && Xs(n);
      }),
      (this.handlePortalMouseDown = n => {
        this.props.stopPropagation && Xs(n);
      }),
      (this.handlePortalFocus = n => {
        this.props.stopPropagation && Xs(n);
      }),
      (this.handlePortalBlur = n => {
        this.props.stopPropagation && Xs(n);
      }),
      (this.handlePortalInnerKeyDown = n => {
        this.foundation.handleContainerKeydown(n);
      }),
      (this.renderContentNode = n => {
        const o = { initialFocusRef: this.initialFocusRef };
        return Dh(n) ? n(o) : n;
      }),
      (this.renderPortal = () => {
        const {
            containerStyle: n = {},
            visible: o,
            portalEventSet: a,
            placement: l,
            displayNone: c,
            transitionState: d,
            id: h,
            isPositionUpdated: g,
          } = this.state,
          { prefixCls: y, content: w, showArrow: S, style: _, motion: x, role: T, zIndex: O } = this.props,
          L = this.renderContentNode(w),
          { className: I } = this.props,
          $ = this.context.direction,
          H = de(I, {
            [`${y}-wrapper`]: !0,
            [`${y}-wrapper-show`]: o,
            [`${y}-with-arrow`]: !!S,
            [`${y}-rtl`]: $ === 'rtl',
          }),
          V = this.renderIcon(),
          F = yo(n, x ? ['transformOrigin'] : void 0),
          b = De(n, 'transformOrigin'),
          q = De(_, 'opacity', null),
          W = q || 1,
          X = E.createElement(
            Fh,
            {
              fillMode: 'forwards',
              animationState: d,
              motion: x && g,
              startClassName: d === 'enter' ? `${tl}-animation-show` : `${tl}-animation-hide`,
              onAnimationStart: () => (this.isAnimating = !0),
              onAnimationEnd: () => {
                var G, oe;
                d === 'leave' &&
                  (this.didLeave(), (oe = (G = this.props).afterClose) === null || oe === void 0 || oe.call(G)),
                  (this.isAnimating = !1);
              },
            },
            G => {
              let { animationStyle: oe, animationClassName: ie, animationEventsNeedBind: fe } = G;
              return E.createElement(
                'div',
                Object.assign(
                  {
                    className: de(H, ie),
                    style: Object.assign(
                      Object.assign(
                        Object.assign(Object.assign(Object.assign({}, oe), c ? { display: 'none' } : {}), {
                          transformOrigin: b,
                        }),
                        _
                      ),
                      q ? { opacity: g ? W : '0' } : {}
                    ),
                  },
                  a,
                  fe,
                  { role: T, 'x-placement': l, id: h }
                ),
                E.createElement('div', { className: `${tl}-content` }, L),
                V
              );
            }
          );
        return E.createElement(
          Sl,
          { getPopupContainer: this.props.getPopupContainer, style: { zIndex: O } },
          E.createElement(
            'div',
            {
              tabIndex: -1,
              className: `${nr}-portal-inner`,
              style: F,
              ref: this.setContainerEl,
              onClick: this.handlePortalInnerClick,
              onFocus: this.handlePortalFocus,
              onBlur: this.handlePortalBlur,
              onMouseDown: this.handlePortalMouseDown,
              onKeyDown: this.handlePortalInnerKeyDown,
            },
            X
          )
        );
      }),
      (this.wrapSpan = n => {
        const { wrapperClassName: o } = this.props,
          a = De(n, 'props.style.display'),
          l = De(n, 'props.block'),
          c = typeof n == 'string',
          d = {};
        return (
          c || (d.display = 'inline-block'),
          (l || HT.includes(a)) && (d.width = '100%'),
          E.createElement('span', { className: o, style: d }, n)
        );
      }),
      (this.mergeEvents = (n, o) => {
        const a = {};
        return (
          pT(o, (l, c) => {
            typeof l == 'function' &&
              (a[c] = function () {
                l(...arguments), n && typeof n[c] == 'function' && n[c](...arguments);
              });
          }),
          a
        );
      }),
      (this.getPopupId = () => this.state.id),
      (this.state = {
        visible: !1,
        transitionState: '',
        triggerEventSet: {},
        portalEventSet: {},
        containerStyle: {},
        isInsert: !1,
        placement: r.position || 'top',
        transitionStyle: {},
        isPositionUpdated: !1,
        id: r.wrapperId,
        displayNone: !1,
      }),
      (this.foundation = new CT(this.adapter)),
      (this.eventManager = new hT()),
      (this.triggerEl = E.createRef()),
      (this.containerEl = E.createRef()),
      (this.initialFocusRef = E.createRef()),
      (this.clickOutsideHandler = null),
      (this.resizeHandler = null),
      (this.isWrapped = !1),
      (this.containerPosition = void 0);
  }
  get adapter() {
    var r = this;
    return Object.assign(Object.assign({}, super.adapter), {
      on: function () {
        return r.eventManager.on(...arguments);
      },
      off: function () {
        return r.eventManager.off(...arguments);
      },
      getAnimatingState: () => this.isAnimating,
      insertPortal: (n, o) => {
        var { position: a } = o,
          l = R_(o, ['position']);
        (this.cachedLatestTransitionState = 'enter'),
          this.setState(
            {
              isInsert: !0,
              transitionState: 'enter',
              containerStyle: Object.assign(Object.assign({}, this.state.containerStyle), l),
            },
            () => {
              setTimeout(() => {
                this.cachedLatestTransitionState === 'enter' && this.eventManager.emit('portalInserted');
              }, 0);
            }
          );
      },
      removePortal: () => {
        this.setState({ isInsert: !1, isPositionUpdated: !1 });
      },
      getEventName: () => ({
        mouseEnter: 'onMouseEnter',
        mouseLeave: 'onMouseLeave',
        mouseOut: 'onMouseOut',
        mouseOver: 'onMouseOver',
        click: 'onClick',
        focus: 'onFocus',
        blur: 'onBlur',
        keydown: 'onKeyDown',
        contextMenu: 'onContextMenu',
      }),
      registerTriggerEvent: n => {
        this.setState({ triggerEventSet: n });
      },
      registerPortalEvent: n => {
        this.setState({ portalEventSet: n });
      },
      getTriggerBounding: () => {
        const n = this.adapter.getTriggerNode();
        return (this.triggerEl.current = n), n && n.getBoundingClientRect();
      },
      getPopupContainerRect: () => {
        const n = this.getPopupContainer();
        let o = null;
        if (n && ha(n)) {
          const a = mT(n.getBoundingClientRect());
          o = Object.assign(Object.assign({}, a), { scrollLeft: n.scrollLeft, scrollTop: n.scrollTop });
        }
        return o;
      },
      containerIsBody: () => this.getPopupContainer() === document.body,
      containerIsRelative: () => {
        const n = this.getPopupContainer();
        return window.getComputedStyle(n).getPropertyValue('position') === 'relative';
      },
      containerIsRelativeOrAbsolute: () => ['relative', 'absolute'].includes(this.containerPosition),
      getWrapperBounding: () => {
        const n = this.containerEl && this.containerEl.current;
        return n && n.getBoundingClientRect();
      },
      getDocumentElementBounding: () => document.documentElement.getBoundingClientRect(),
      setPosition: n => {
        var { position: o } = n,
          a = R_(n, ['position']);
        this.setState(
          {
            containerStyle: Object.assign(Object.assign({}, this.state.containerStyle), a),
            placement: o,
            isPositionUpdated: !0,
          },
          () => {
            this.eventManager.emit('positionUpdated');
          }
        );
      },
      setDisplayNone: (n, o) => {
        this.setState({ displayNone: n }, o);
      },
      updatePlacementAttr: n => {
        this.setState({ placement: n });
      },
      togglePortalVisible: (n, o) => {
        const a = {};
        (a.transitionState = n ? 'enter' : 'leave'),
          (a.visible = n),
          (this.cachedLatestTransitionState = a.transitionState),
          this.mounted &&
            this.setState(a, () => {
              o();
            });
      },
      registerClickOutsideHandler: n => {
        this.clickOutsideHandler && this.adapter.unregisterClickOutsideHandler(),
          (this.clickOutsideHandler = o => {
            if (!this.mounted) return !1;
            let a = this.triggerEl && this.triggerEl.current,
              l = this.containerEl && this.containerEl.current;
            a = mc.findDOMNode(a);
            const c = o.target,
              d = (o.composedPath && o.composedPath()) || [c],
              h = this.props.clickTriggerToHide ? (a && a.contains(c)) || d.includes(a) : !1;
            ((a && !a.contains(c) && l && !l.contains(c) && !(d.includes(l) || d.includes(a))) || h) &&
              (this.props.onClickOutSide(o), n());
          }),
          window.addEventListener('mousedown', this.clickOutsideHandler);
      },
      unregisterClickOutsideHandler: () => {
        this.clickOutsideHandler &&
          (window.removeEventListener('mousedown', this.clickOutsideHandler), (this.clickOutsideHandler = null));
      },
      registerResizeHandler: n => {
        this.resizeHandler && this.adapter.unregisterResizeHandler(),
          (this.resizeHandler = l0(o => {
            if (!this.mounted) return !1;
            n(o);
          }, 10)),
          window.addEventListener('resize', this.resizeHandler, !1);
      },
      unregisterResizeHandler: () => {
        this.resizeHandler &&
          (window.removeEventListener('resize', this.resizeHandler, !1), (this.resizeHandler = null));
      },
      notifyVisibleChange: n => {
        this.props.onVisibleChange(n);
      },
      registerScrollHandler: n => {
        this.scrollHandler && this.adapter.unregisterScrollHandler(),
          (this.scrollHandler = l0(o => {
            if (!this.mounted) return !1;
            const a = this.adapter.getTriggerNode();
            if (o.target.contains(a)) {
              const c = { x: o.target.scrollLeft, y: o.target.scrollTop };
              n(c);
            }
          }, 10)),
          window.addEventListener('scroll', this.scrollHandler, !0);
      },
      unregisterScrollHandler: () => {
        this.scrollHandler &&
          (window.removeEventListener('scroll', this.scrollHandler, !0), (this.scrollHandler = null));
      },
      canMotion: () => !!this.props.motion,
      updateContainerPosition: () => {
        const n = document.body.getAttribute('data-position');
        if (n) {
          this.containerPosition = n;
          return;
        }
        requestAnimationFrame(() => {
          const o = this.getPopupContainer();
          if (o && ha(o)) {
            const l = window.getComputedStyle(o).getPropertyValue('position');
            document.body.setAttribute('data-position', l), (this.containerPosition = l);
          }
        });
      },
      getContainerPosition: () => this.containerPosition,
      getContainer: () => this.containerEl && this.containerEl.current,
      getTriggerNode: () => {
        let n = this.triggerEl.current;
        return ha(this.triggerEl.current) || (n = mc.findDOMNode(this.triggerEl.current)), n;
      },
      getFocusableElements: n => jT(n),
      getActiveElement: () => LT(),
      setInitialFocus: () => {
        const { preventScroll: n } = this.props,
          o = De(this, 'initialFocusRef.current');
        o && 'focus' in o && o.focus({ preventScroll: n });
      },
      notifyEscKeydown: n => {
        this.props.onEscKeyDown(n);
      },
      setId: () => {
        this.setState({ id: m1() });
      },
      getTriggerDOM: () => (this.triggerEl.current ? mc.findDOMNode(this.triggerEl.current) : null),
    });
  }
  componentDidMount() {
    (this.mounted = !0),
      (this.getPopupContainer = this.props.getPopupContainer || this.context.getPopupContainer || KT),
      this.foundation.init(),
      Mh(() => {
        let r = this.triggerEl.current;
        r && (r instanceof HTMLElement || (r = xa.findDOMNode(r))), this.foundation.updateStateIfCursorOnTrigger(r);
      }, 1);
  }
  componentWillUnmount() {
    (this.mounted = !1), this.foundation.destroy();
  }
  focusTrigger() {
    this.foundation.focusTrigger();
  }
  rePosition() {
    return this.foundation.calcPosition();
  }
  componentDidUpdate(r, n) {
    _a(
      this.props.mouseLeaveDelay < this.props.mouseEnterDelay,
      "[Semi Tooltip] 'mouseLeaveDelay' cannot be less than 'mouseEnterDelay', which may cause the dropdown layer to not be hidden."
    ),
      r.visible !== this.props.visible &&
        (['hover', 'focus'].includes(this.props.trigger)
          ? this.props.visible
            ? this.foundation.delayShow()
            : this.foundation.delayHide()
          : this.props.visible
          ? this.foundation.show()
          : this.foundation.hide()),
      oo(r.rePosKey, this.props.rePosKey) || this.rePosition();
  }
  render() {
    const { isInsert: r, triggerEventSet: n, visible: o, id: a } = this.state,
      { wrapWhenSpecial: l, role: c, trigger: d } = this.props;
    let { children: h } = this.props;
    const g = Object.assign({}, De(h, 'props.style')),
      y = {};
    if (l) {
      const _ = this.isSpecial(h);
      _
        ? ((g.pointerEvents = 'none'),
          _ === io.STATUS_DISABLED && (y.cursor = 'not-allowed'),
          (h = A.cloneElement(h, { style: g })),
          d !== 'custom' && (h = this.wrapSpan(h)),
          (this.isWrapped = !0))
        : A.isValidElement(h) || ((h = this.wrapSpan(h)), (this.isWrapped = !0));
    }
    let w = {};
    c === 'dialog'
      ? ((w['aria-expanded'] = o ? 'true' : 'false'), (w['aria-haspopup'] = 'dialog'), (w['aria-controls'] = a))
      : (w['aria-describedby'] = a);
    const S = E.cloneElement(
      h,
      Object.assign(Object.assign(Object.assign(Object.assign({}, w), h.props), this.mergeEvents(h.props, n)), {
        style: Object.assign(Object.assign({}, De(h, 'props.style')), y),
        className: de(De(h, 'props.className')),
        ref: _ => {
          const { tooltipRef: x } = h.props;
          x ? (this.triggerEl.current = x.current) : (this.triggerEl.current = _);
          const { ref: T } = h;
          typeof T == 'function' ? T(_) : T && typeof T == 'object' && (T.current = _);
        },
        tabIndex: h.props.tabIndex || 0,
        'data-popupid': a,
      })
    );
    return E.createElement(E.Fragment, null, r ? this.renderPortal() : null, S);
  }
}
zr.contextType = _l;
zr.propTypes = {
  children: m.node,
  motion: m.bool,
  autoAdjustOverflow: m.bool,
  position: m.oneOf(BT),
  getPopupContainer: m.func,
  mouseEnterDelay: m.number,
  mouseLeaveDelay: m.number,
  trigger: m.oneOf(UT).isRequired,
  className: m.string,
  wrapperClassName: m.string,
  clickToHide: m.bool,
  clickTriggerToHide: m.bool,
  visible: m.bool,
  style: m.object,
  content: m.oneOfType([m.node, m.func]),
  prefixCls: m.string,
  onVisibleChange: m.func,
  onClickOutSide: m.func,
  spacing: m.oneOfType([m.number, m.object]),
  margin: m.oneOfType([m.number, m.object]),
  showArrow: m.oneOfType([m.bool, m.node]),
  zIndex: m.number,
  rePosKey: m.oneOfType([m.string, m.number]),
  arrowBounding: qT,
  transformFromCenter: m.bool,
  arrowPointAtCenter: m.bool,
  stopPropagation: m.bool,
  role: m.string,
  wrapWhenSpecial: m.bool,
  guardFocus: m.bool,
  returnFocusOnClose: m.bool,
  preventScroll: m.bool,
  keepDOM: m.bool,
};
zr.__SemiComponentName__ = 'Tooltip';
zr.defaultProps = Pi(zr.__SemiComponentName__, {
  arrowBounding: Wn.ARROW_BOUNDING,
  autoAdjustOverflow: !0,
  arrowPointAtCenter: !0,
  trigger: 'hover',
  transformFromCenter: !0,
  position: 'top',
  prefixCls: tl,
  role: 'tooltip',
  mouseEnterDelay: Wn.MOUSE_ENTER_DELAY,
  mouseLeaveDelay: Wn.MOUSE_LEAVE_DELAY,
  motion: !0,
  onVisibleChange: ze,
  onClickOutSide: ze,
  spacing: Wn.SPACING,
  margin: Wn.MARGIN,
  showArrow: !0,
  wrapWhenSpecial: !0,
  zIndex: Wn.DEFAULT_Z_INDEX,
  closeOnEsc: !1,
  guardFocus: !1,
  returnFocusOnClose: !1,
  onEscKeyDown: ze,
  disableFocusListener: !1,
  disableArrowKeyDown: !1,
  keepDOM: !1,
});
var Ys = { exports: {} },
  I_;
function VT() {
  if (I_) return Ys.exports;
  I_ = 1;
  const i = (r, { target: n = document.body } = {}) => {
    const o = document.createElement('textarea'),
      a = document.activeElement;
    (o.value = r),
      o.setAttribute('readonly', ''),
      (o.style.contain = 'strict'),
      (o.style.position = 'absolute'),
      (o.style.left = '-9999px'),
      (o.style.fontSize = '12pt');
    const l = document.getSelection();
    let c = !1;
    l.rangeCount > 0 && (c = l.getRangeAt(0)),
      n.append(o),
      o.select(),
      (o.selectionStart = 0),
      (o.selectionEnd = r.length);
    let d = !1;
    try {
      d = document.execCommand('copy');
    } catch {}
    return o.remove(), c && (l.removeAllRanges(), l.addRange(c)), a && a.focus(), d;
  };
  return (Ys.exports = i), (Ys.exports.default = i), Ys.exports;
}
var WT = VT();
const GT = ut(WT);
function _n() {}
const XT = E.createContext(null);
function Fp(i) {
  return function () {
    var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
      n = r.width ? String(r.width) : i.defaultWidth,
      o = i.formats[n] || i.formats[i.defaultWidth];
    return o;
  };
}
function aa(i) {
  return function (r, n) {
    var o = n != null && n.context ? String(n.context) : 'standalone',
      a;
    if (o === 'formatting' && i.formattingValues) {
      var l = i.defaultFormattingWidth || i.defaultWidth,
        c = n != null && n.width ? String(n.width) : l;
      a = i.formattingValues[c] || i.formattingValues[l];
    } else {
      var d = i.defaultWidth,
        h = n != null && n.width ? String(n.width) : i.defaultWidth;
      a = i.values[h] || i.values[d];
    }
    var g = i.argumentCallback ? i.argumentCallback(r) : r;
    return a[g];
  };
}
function sa(i) {
  return function (r) {
    var n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
      o = n.width,
      a = (o && i.matchPatterns[o]) || i.matchPatterns[i.defaultMatchWidth],
      l = r.match(a);
    if (!l) return null;
    var c = l[0],
      d = (o && i.parsePatterns[o]) || i.parsePatterns[i.defaultParseWidth],
      h = Array.isArray(d)
        ? QT(d, function (w) {
            return w.test(c);
          })
        : YT(d, function (w) {
            return w.test(c);
          }),
      g;
    (g = i.valueCallback ? i.valueCallback(h) : h), (g = n.valueCallback ? n.valueCallback(g) : g);
    var y = r.slice(c.length);
    return { value: g, rest: y };
  };
}
function YT(i, r) {
  for (var n in i) if (i.hasOwnProperty(n) && r(i[n])) return n;
}
function QT(i, r) {
  for (var n = 0; n < i.length; n++) if (r(i[n])) return n;
}
function ZT(i) {
  return function (r) {
    var n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
      o = r.match(i.matchPattern);
    if (!o) return null;
    var a = o[0],
      l = r.match(i.parsePattern);
    if (!l) return null;
    var c = i.valueCallback ? i.valueCallback(l[0]) : l[0];
    c = n.valueCallback ? n.valueCallback(c) : c;
    var d = r.slice(a.length);
    return { value: c, rest: d };
  };
}
function ah(i) {
  '@babel/helpers - typeof';
  return (
    (ah =
      typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
        ? function (r) {
            return typeof r;
          }
        : function (r) {
            return r && typeof Symbol == 'function' && r.constructor === Symbol && r !== Symbol.prototype
              ? 'symbol'
              : typeof r;
          }),
    ah(i)
  );
}
function JT(i) {
  if (i === null || i === !0 || i === !1) return NaN;
  var r = Number(i);
  return isNaN(r) ? r : r < 0 ? Math.ceil(r) : Math.floor(r);
}
function $h(i, r) {
  if (r.length < i)
    throw new TypeError(i + ' argument' + (i > 1 ? 's' : '') + ' required, but only ' + r.length + ' present');
}
function eR(i) {
  $h(1, arguments);
  var r = Object.prototype.toString.call(i);
  return i instanceof Date || (ah(i) === 'object' && r === '[object Date]')
    ? new Date(i.getTime())
    : typeof i == 'number' || r === '[object Number]'
    ? new Date(i)
    : ((typeof i == 'string' || r === '[object String]') &&
        typeof console < 'u' &&
        (console.warn(
          "Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. Please use `parseISO` to parse strings. See: https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#string-arguments"
        ),
        console.warn(new Error().stack)),
      new Date(NaN));
}
var tR = {};
function rR() {
  return tR;
}
function N_(i, r) {
  var n, o, a, l, c, d, h, g;
  $h(1, arguments);
  var y = rR(),
    w = JT(
      (n =
        (o =
          (a =
            (l = r?.weekStartsOn) !== null && l !== void 0
              ? l
              : r == null || (c = r.locale) === null || c === void 0 || (d = c.options) === null || d === void 0
              ? void 0
              : d.weekStartsOn) !== null && a !== void 0
            ? a
            : y.weekStartsOn) !== null && o !== void 0
          ? o
          : (h = y.locale) === null || h === void 0 || (g = h.options) === null || g === void 0
          ? void 0
          : g.weekStartsOn) !== null && n !== void 0
        ? n
        : 0
    );
  if (!(w >= 0 && w <= 6)) throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
  var S = eR(i),
    _ = S.getUTCDay(),
    x = (_ < w ? 7 : 0) + _ - w;
  return S.setUTCDate(S.getUTCDate() - x), S.setUTCHours(0, 0, 0, 0), S;
}
function nR(i, r, n) {
  $h(2, arguments);
  var o = N_(i, n),
    a = N_(r, n);
  return o.getTime() === a.getTime();
}
var iR = {
    lessThanXSeconds: { one: '不到 1 秒', other: '不到 {{count}} 秒' },
    xSeconds: { one: '1 秒', other: '{{count}} 秒' },
    halfAMinute: '半分钟',
    lessThanXMinutes: { one: '不到 1 分钟', other: '不到 {{count}} 分钟' },
    xMinutes: { one: '1 分钟', other: '{{count}} 分钟' },
    xHours: { one: '1 小时', other: '{{count}} 小时' },
    aboutXHours: { one: '大约 1 小时', other: '大约 {{count}} 小时' },
    xDays: { one: '1 天', other: '{{count}} 天' },
    aboutXWeeks: { one: '大约 1 个星期', other: '大约 {{count}} 个星期' },
    xWeeks: { one: '1 个星期', other: '{{count}} 个星期' },
    aboutXMonths: { one: '大约 1 个月', other: '大约 {{count}} 个月' },
    xMonths: { one: '1 个月', other: '{{count}} 个月' },
    aboutXYears: { one: '大约 1 年', other: '大约 {{count}} 年' },
    xYears: { one: '1 年', other: '{{count}} 年' },
    overXYears: { one: '超过 1 年', other: '超过 {{count}} 年' },
    almostXYears: { one: '将近 1 年', other: '将近 {{count}} 年' },
  },
  oR = function (r, n, o) {
    var a,
      l = iR[r];
    return (
      typeof l == 'string' ? (a = l) : n === 1 ? (a = l.one) : (a = l.other.replace('{{count}}', String(n))),
      o != null && o.addSuffix ? (o.comparison && o.comparison > 0 ? a + '内' : a + '前') : a
    );
  },
  aR = { full: "y'年'M'月'd'日' EEEE", long: "y'年'M'月'd'日'", medium: 'yyyy-MM-dd', short: 'yy-MM-dd' },
  sR = { full: 'zzzz a h:mm:ss', long: 'z a h:mm:ss', medium: 'a h:mm:ss', short: 'a h:mm' },
  lR = {
    full: '{{date}} {{time}}',
    long: '{{date}} {{time}}',
    medium: '{{date}} {{time}}',
    short: '{{date}} {{time}}',
  },
  uR = {
    date: Fp({ formats: aR, defaultWidth: 'full' }),
    time: Fp({ formats: sR, defaultWidth: 'full' }),
    dateTime: Fp({ formats: lR, defaultWidth: 'full' }),
  };
function k_(i, r, n) {
  var o = 'eeee p';
  return nR(i, r, n) ? o : i.getTime() > r.getTime() ? "'下个'" + o : "'上个'" + o;
}
var cR = { lastWeek: k_, yesterday: "'昨天' p", today: "'今天' p", tomorrow: "'明天' p", nextWeek: k_, other: 'PP p' },
  dR = function (r, n, o, a) {
    var l = cR[r];
    return typeof l == 'function' ? l(n, o, a) : l;
  },
  fR = { narrow: ['前', '公元'], abbreviated: ['前', '公元'], wide: ['公元前', '公元'] },
  pR = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['第一季', '第二季', '第三季', '第四季'],
    wide: ['第一季度', '第二季度', '第三季度', '第四季度'],
  },
  hR = {
    narrow: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'],
    abbreviated: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    wide: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  },
  mR = {
    narrow: ['日', '一', '二', '三', '四', '五', '六'],
    short: ['日', '一', '二', '三', '四', '五', '六'],
    abbreviated: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    wide: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  },
  gR = {
    narrow: {
      am: '上',
      pm: '下',
      midnight: '凌晨',
      noon: '午',
      morning: '早',
      afternoon: '下午',
      evening: '晚',
      night: '夜',
    },
    abbreviated: {
      am: '上午',
      pm: '下午',
      midnight: '凌晨',
      noon: '中午',
      morning: '早晨',
      afternoon: '中午',
      evening: '晚上',
      night: '夜间',
    },
    wide: {
      am: '上午',
      pm: '下午',
      midnight: '凌晨',
      noon: '中午',
      morning: '早晨',
      afternoon: '中午',
      evening: '晚上',
      night: '夜间',
    },
  },
  yR = {
    narrow: {
      am: '上',
      pm: '下',
      midnight: '凌晨',
      noon: '午',
      morning: '早',
      afternoon: '下午',
      evening: '晚',
      night: '夜',
    },
    abbreviated: {
      am: '上午',
      pm: '下午',
      midnight: '凌晨',
      noon: '中午',
      morning: '早晨',
      afternoon: '中午',
      evening: '晚上',
      night: '夜间',
    },
    wide: {
      am: '上午',
      pm: '下午',
      midnight: '凌晨',
      noon: '中午',
      morning: '早晨',
      afternoon: '中午',
      evening: '晚上',
      night: '夜间',
    },
  },
  vR = function (r, n) {
    var o = Number(r);
    switch (n?.unit) {
      case 'date':
        return o.toString() + '日';
      case 'hour':
        return o.toString() + '时';
      case 'minute':
        return o.toString() + '分';
      case 'second':
        return o.toString() + '秒';
      default:
        return '第 ' + o.toString();
    }
  },
  wR = {
    ordinalNumber: vR,
    era: aa({ values: fR, defaultWidth: 'wide' }),
    quarter: aa({
      values: pR,
      defaultWidth: 'wide',
      argumentCallback: function (r) {
        return r - 1;
      },
    }),
    month: aa({ values: hR, defaultWidth: 'wide' }),
    day: aa({ values: mR, defaultWidth: 'wide' }),
    dayPeriod: aa({ values: gR, defaultWidth: 'wide', formattingValues: yR, defaultFormattingWidth: 'wide' }),
  },
  _R = /^(第\s*)?\d+(日|时|分|秒)?/i,
  SR = /\d+/i,
  ER = { narrow: /^(前)/i, abbreviated: /^(前)/i, wide: /^(公元前|公元)/i },
  bR = { any: [/^(前)/i, /^(公元)/i] },
  CR = { narrow: /^[1234]/i, abbreviated: /^第[一二三四]刻/i, wide: /^第[一二三四]刻钟/i },
  OR = { any: [/(1|一)/i, /(2|二)/i, /(3|三)/i, /(4|四)/i] },
  xR = {
    narrow: /^(一|二|三|四|五|六|七|八|九|十[二一])/i,
    abbreviated: /^(一|二|三|四|五|六|七|八|九|十[二一]|\d|1[12])月/i,
    wide: /^(一|二|三|四|五|六|七|八|九|十[二一])月/i,
  },
  PR = {
    narrow: [
      /^一/i,
      /^二/i,
      /^三/i,
      /^四/i,
      /^五/i,
      /^六/i,
      /^七/i,
      /^八/i,
      /^九/i,
      /^十(?!(一|二))/i,
      /^十一/i,
      /^十二/i,
    ],
    any: [
      /^一|1/i,
      /^二|2/i,
      /^三|3/i,
      /^四|4/i,
      /^五|5/i,
      /^六|6/i,
      /^七|7/i,
      /^八|8/i,
      /^九|9/i,
      /^十(?!(一|二))|10/i,
      /^十一|11/i,
      /^十二|12/i,
    ],
  },
  TR = {
    narrow: /^[一二三四五六日]/i,
    short: /^[一二三四五六日]/i,
    abbreviated: /^周[一二三四五六日]/i,
    wide: /^星期[一二三四五六日]/i,
  },
  RR = { any: [/日/i, /一/i, /二/i, /三/i, /四/i, /五/i, /六/i] },
  IR = { any: /^(上午?|下午?|午夜|[中正]午|早上?|下午|晚上?|凌晨|)/i },
  NR = {
    any: {
      am: /^上午?/i,
      pm: /^下午?/i,
      midnight: /^午夜/i,
      noon: /^[中正]午/i,
      morning: /^早上/i,
      afternoon: /^下午/i,
      evening: /^晚上?/i,
      night: /^凌晨/i,
    },
  },
  kR = {
    ordinalNumber: ZT({
      matchPattern: _R,
      parsePattern: SR,
      valueCallback: function (r) {
        return parseInt(r, 10);
      },
    }),
    era: sa({ matchPatterns: ER, defaultMatchWidth: 'wide', parsePatterns: bR, defaultParseWidth: 'any' }),
    quarter: sa({
      matchPatterns: CR,
      defaultMatchWidth: 'wide',
      parsePatterns: OR,
      defaultParseWidth: 'any',
      valueCallback: function (r) {
        return r + 1;
      },
    }),
    month: sa({ matchPatterns: xR, defaultMatchWidth: 'wide', parsePatterns: PR, defaultParseWidth: 'any' }),
    day: sa({ matchPatterns: TR, defaultMatchWidth: 'wide', parsePatterns: RR, defaultParseWidth: 'any' }),
    dayPeriod: sa({ matchPatterns: IR, defaultMatchWidth: 'any', parsePatterns: NR, defaultParseWidth: 'any' }),
  },
  AR = {
    code: 'zh-CN',
    formatDistance: oR,
    formatLong: uR,
    formatRelative: dR,
    localize: wR,
    match: kR,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  };
const A_ = {
  code: 'zh-CN',
  currency: 'CNY',
  dateFnsLocale: AR,
  Pagination: { pageSize: '每页条数：${pageSize}', total: '总页数：${total}', jumpTo: '跳至', page: '页' },
  Modal: { confirm: '确定', cancel: '取消' },
  Tabs: { more: '更多' },
  TimePicker: {
    placeholder: { time: '请选择时间', timeRange: '请选择时间范围' },
    begin: '开始时间',
    end: '结束时间',
    hour: '时',
    minute: '分',
    second: '秒',
    AM: '上午',
    PM: '下午',
  },
  DatePicker: {
    placeholder: {
      date: '请选择日期',
      dateTime: '请选择日期及时间',
      dateRange: ['开始日期', '结束日期'],
      dateTimeRange: ['开始日期', '结束日期'],
      monthRange: ['开始月份', '结束月份'],
    },
    presets: '快捷选择',
    footer: { confirm: '确定', cancel: '取消' },
    selectDate: '返回选择日期',
    selectTime: '选择时间',
    year: '年',
    month: '月',
    day: '日',
    monthText: '${year}年 ${month}',
    months: {
      1: '1月',
      2: '2月',
      3: '3月',
      4: '4月',
      5: '5月',
      6: '6月',
      7: '7月',
      8: '8月',
      9: '9月',
      10: '10月',
      11: '11月',
      12: '12月',
    },
    fullMonths: {
      1: '1',
      2: '2',
      3: '3',
      4: '4',
      5: '5',
      6: '6',
      7: '7',
      8: '8',
      9: '9',
      10: '10',
      11: '11',
      12: '12',
    },
    weeks: { Mon: '一', Tue: '二', Wed: '三', Thu: '四', Fri: '五', Sat: '六', Sun: '日' },
    localeFormatToken: { FORMAT_SWITCH_DATE: 'yyyy-MM-dd' },
  },
  Navigation: { collapseText: '收起侧边栏', expandText: '展开侧边栏' },
  Popconfirm: { confirm: '确定', cancel: '取消' },
  Table: {
    emptyText: '暂无数据',
    pageText: '显示第 ${currentStart} 条-第 ${currentEnd} 条，共 ${total} 条',
    descend: '点击降序',
    ascend: '点击升序',
    cancelSort: '取消排序',
  },
  Select: { emptyText: '暂无数据', createText: '创建' },
  Cascader: { emptyText: '暂无数据' },
  Tree: { emptyText: '暂无数据', searchPlaceholder: '搜索' },
  List: { emptyText: '暂无数据' },
  Calendar: {
    allDay: '全天',
    AM: '上午${time}时',
    PM: '下午${time}时',
    datestring: '日',
    remaining: '还有${remained}项',
  },
  Upload: {
    mainText: '点击上传文件或拖拽文件到这里',
    illegalTips: '不支持此类型文件',
    legalTips: '松手开始上传',
    retry: '重试',
    replace: '替换文件',
    clear: '清空',
    selectedFiles: '已选择文件',
    illegalSize: '文件尺寸不合法',
    fail: '上传失败',
  },
  TreeSelect: { searchPlaceholder: '搜索' },
  Typography: { copy: '复制', copied: '复制成功', expand: '展开', collapse: '收起' },
  Transfer: {
    emptyLeft: '暂无数据',
    emptySearch: '无搜索结果',
    emptyRight: '暂无内容，可从左侧勾选',
    placeholder: '搜索',
    clear: '清空',
    selectAll: '全选',
    clearSelectAll: '取消全选',
    total: '总个数：${total}',
    selected: '已选个数：${total}',
  },
  Form: { optional: '（可选）' },
  Image: {
    preview: '预览',
    loading: '加载中',
    loadError: '加载失败',
    prevTip: '上一张',
    nextTip: '下一张',
    zoomInTip: '放大',
    zoomOutTip: '缩小',
    rotateTip: '旋转',
    downloadTip: '下载',
    adaptiveTip: '适应页面',
    originTip: '原始尺寸',
  },
  Chat: {
    deleteConfirm: '确认删除该会话吗？',
    clearContext: '上下文已清除',
    copySuccess: '复制成功',
    stop: '停止',
    copy: '复制',
    copied: '复制成功',
    dropAreaText: '将文件放到这里',
  },
  UserGuide: { skip: '跳过', next: '下一步', prev: '上一步', finish: '完成' },
  InputNumber: {},
  JsonViewer: { search: '查找', replace: '替换', replaceAll: '全部替换' },
  VideoPlayer: {
    rateChange: '切换速率至 ${rate}',
    qualityChange: '切换清晰度至${quality}',
    routeChange: '切换线路至${route}',
    mirror: '镜像',
    cancelMirror: '取消镜像',
    loading: '加载中...',
    stall: '加载失败',
    noResource: '暂无资源',
    videoError: '视频加载错误',
  },
  AIChatDialogue: {
    delete: '删除',
    deleteConfirm: '确认要删除吗？',
    deleteContent: '删除后将无法恢复！',
    copySuccess: '复制成功',
    loading: '请稍候...',
    reasoning: { completed: '已思考完成', thinking: '正在思考中...' },
    annotationText: '篇资料',
  },
  Feedback: { submit: '提交', cancel: '取消' },
  AIChatInput: { template: '模板', configure: '配置', selected: '已选 ${count} 个' },
};
class so extends A.Component {
  renderChildren(r, n) {
    const { componentName: o } = this.props;
    let a = r;
    r?.code || (a = A_);
    const l = De(A_, 'dateFnsLocale'),
      c = De(a, 'dateFnsLocale', l),
      d = De(a, 'currency');
    return n(a[o], a.code, c, d);
  }
  render() {
    const { children: r } = this.props;
    return E.createElement(_l.Consumer, null, n => {
      let { locale: o } = n;
      return E.createElement(XT.Consumer, null, a => this.renderChildren(o || a, r));
    });
  }
}
so.propTypes = { componentName: m.string.isRequired, children: m.any };
so.defaultProps = { componentName: '' };
const LR = 'semi';
var jR = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const v1 = E.forwardRef((i, r) => {
  const {
      svg: n,
      spin: o = !1,
      rotate: a,
      style: l,
      className: c,
      prefixCls: d = LR,
      type: h,
      size: g = 'default',
      fill: y,
    } = i,
    w = jR(i, ['svg', 'spin', 'rotate', 'style', 'className', 'prefixCls', 'type', 'size', 'fill']),
    S = de(
      `${d}-icon`,
      {
        [`${d}-icon-extra-small`]: g === 'extra-small',
        [`${d}-icon-small`]: g === 'small',
        [`${d}-icon-default`]: g === 'default',
        [`${d}-icon-large`]: g === 'large',
        [`${d}-icon-extra-large`]: g === 'extra-large',
        [`${d}-icon-spinning`]: o === !0,
        [`${d}-icon-${h}`]: !!h,
      },
      c
    ),
    _ = {};
  return (
    Number.isSafeInteger(a) && (_.transform = `rotate(${a}deg)`),
    Object.assign(_, l),
    E.createElement(
      'span',
      Object.assign({ role: 'img', ref: r, 'aria-label': h, className: S, style: _ }, w),
      y ? E.cloneElement(n, { fill: y }) : n
    )
  );
});
v1.elementType = 'Icon';
const Ti = (i, r) => {
  const n = E.forwardRef((o, a) => E.createElement(v1, Object.assign({ svg: E.createElement(i), type: r, ref: a }, o)));
  return (n.elementType = 'Icon'), n;
};
function DR() {
  let i = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const { prefix: r = '', length: n = 7 } = i,
    o = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ',
    a = o.length;
  let l = '';
  for (let c = 0; c < n; c++) {
    const d = Math.floor(Math.random() * a);
    l += o.charAt(d);
  }
  return r ? `${r}-${l}` : l;
}
function MR(i, r) {
  if (typeof i == 'string') return new Array(r).fill(i);
  if (Array.isArray(i)) {
    const n = i.length;
    let o = i;
    if (n < r) {
      let a = 0;
      for (o = []; a < r; ) o.push(i[a % n]), a++;
      return o;
    } else n > r && (o = i.slice(0, r));
    return o.reverse();
  }
  return ['rgba(233,69,255)', 'rgba(166,71,255)', 'rgba(107,97,255)', 'rgba(46,140,255)'];
}
var FR = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
function $R(i) {
  const { fill: r } = i,
    n = FR(i, ['fill']),
    o = DR({ prefix: 'semi-ai-loading' }),
    [a, l, c, d] = MR(r, 4);
  return A.createElement(
    'svg',
    Object.assign(
      {
        viewBox: '0 0 16 16',
        width: '1em',
        height: '1em',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        focusable: !1,
        'aria-hidden': !0,
      },
      n
    ),
    A.createElement('path', {
      d: 'M15.1112 7.99978C15.1112 4.07242 11.9275 0.888672 8.00009 0.888672C5.18219 0.888672 2.74711 2.52771 1.59619 4.90445',
      stroke: `url(#${o})`,
      strokeWidth: '1.77778',
      strokeLinecap: 'round',
    }),
    A.createElement(
      'defs',
      null,
      A.createElement(
        'linearGradient',
        { id: o, x1: '16', y1: '8', x2: '2.68594', y2: '11.022', gradientUnits: 'userSpaceOnUse' },
        A.createElement('stop', { stopColor: a }),
        A.createElement('stop', { offset: '0.3', stopColor: l }),
        A.createElement('stop', { offset: '0.6', stopColor: c }),
        A.createElement('stop', { offset: '1', stopColor: d, stopOpacity: '0' })
      )
    )
  );
}
const zR = Ti($R, 'ai_loading');
function qR(i) {
  return A.createElement(
    'svg',
    Object.assign(
      {
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        width: '1em',
        height: '1em',
        focusable: !1,
        'aria-hidden': !0,
      },
      i
    ),
    A.createElement('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: 'M4.08 7.6a1.5 1.5 0 0 1 2.12 0l5.66 5.65 5.66-5.65a1.5 1.5 0 1 1 2.12 2.12l-6.72 6.72a1.5 1.5 0 0 1-2.12 0L4.08 9.72a1.5 1.5 0 0 1 0-2.12Z',
      fill: 'currentColor',
    })
  );
}
const L_ = Ti(qR, 'chevron_down');
function BR(i) {
  return A.createElement(
    'svg',
    Object.assign(
      {
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        width: '1em',
        height: '1em',
        focusable: !1,
        'aria-hidden': !0,
      },
      i
    ),
    A.createElement('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: 'M7.44 19.8a1.5 1.5 0 0 1 0-2.13l5.66-5.65-5.66-5.66a1.5 1.5 0 1 1 2.12-2.12l6.72 6.72a1.5 1.5 0 0 1 0 2.12L9.56 19.8a1.5 1.5 0 0 1-2.12 0Z',
      fill: 'currentColor',
    })
  );
}
const j_ = Ti(BR, 'chevron_right');
function UR(i) {
  return A.createElement(
    'svg',
    Object.assign(
      {
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        width: '1em',
        height: '1em',
        focusable: !1,
        'aria-hidden': !0,
      },
      i
    ),
    A.createElement('path', {
      d: 'M7 4c0-1.1.9-2 2-2h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-1V8c0-2-1-3-3-3H7V4Z',
      fill: 'currentColor',
    }),
    A.createElement('path', {
      d: 'M5 7a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5Z',
      fill: 'currentColor',
    })
  );
}
const HR = Ti(UR, 'copy');
function KR(i) {
  return A.createElement(
    'svg',
    Object.assign(
      {
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        width: '1em',
        height: '1em',
        focusable: !1,
        'aria-hidden': !0,
      },
      i
    ),
    A.createElement('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: 'M10.62 17.5a8.25 8.25 0 0 1 0-16.5v16.5Zm2.75-11a8.25 8.25 0 1 1 0 16.5V6.5Z',
      fill: 'currentColor',
    })
  );
}
const VR = Ti(KR, 'semi_logo');
function WR(i) {
  return A.createElement(
    'svg',
    Object.assign(
      {
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        width: '1em',
        height: '1em',
        focusable: !1,
        'aria-hidden': !0,
      },
      i
    ),
    A.createElement('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: 'M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm1 2a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H6Z',
      fill: 'currentColor',
    })
  );
}
const GR = Ti(WR, 'sidebar');
function XR(i) {
  return A.createElement(
    'svg',
    Object.assign(
      {
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        width: '1em',
        height: '1em',
        focusable: !1,
        'aria-hidden': !0,
      },
      i
    ),
    A.createElement('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: 'M21.35 4.27c.68.47.86 1.4.38 2.08l-10 14.5a1.5 1.5 0 0 1-2.33.17l-6.5-7a1.5 1.5 0 0 1 2.2-2.04l5.23 5.63 8.94-12.96a1.5 1.5 0 0 1 2.08-.38Z',
      fill: 'currentColor',
    })
  );
}
const sh = Ti(XR, 'tick'),
  YR = 'Enter';
function El(i) {
  return De(i, 'key') === YR;
}
const $p = vl.PREFIX;
class zh extends E.PureComponent {
  constructor(r) {
    super(r),
      (this.copy = n => {
        const { content: o, duration: a, onCopy: l } = this.props,
          c = GT(o);
        l && l(n, o, c), this.setCopied(o, a);
      }),
      (this.setCopied = (n, o) => {
        this.setState({ copied: !0, item: n }),
          (this._timeId = setTimeout(() => {
            this.resetCopied();
          }, o * 1e3));
      }),
      (this.resetCopied = () => {
        this._timeId && (clearTimeout(this._timeId), (this._timeId = null), this.setState({ copied: !1, item: '' }));
      }),
      (this.renderSuccessTip = () => {
        const { successTip: n } = this.props;
        return typeof n < 'u'
          ? n
          : E.createElement(so, { componentName: 'Typography' }, o =>
              E.createElement('span', null, E.createElement(sh, null), o.copied)
            );
      }),
      (this.renderCopyIcon = () => {
        const { icon: n } = this.props,
          o = { role: 'button', tabIndex: 0, onClick: this.copy, onKeyPress: l => El(l) && this.copy(l) },
          a = E.createElement(
            'a',
            { className: `${$p}-action-copy-icon` },
            E.createElement(HR, Object.assign({ onClick: this.copy }, o))
          );
        return E.isValidElement(n) ? E.cloneElement(n, o) : a;
      }),
      (this.state = { copied: !1, item: '' });
  }
  componentWillUnmount() {
    this._timeId && (clearTimeout(this._timeId), (this._timeId = null));
  }
  render() {
    const { style: r, className: n, forwardRef: o, copyTip: a, render: l } = this.props,
      { copied: c } = this.state,
      d = de(n, { [`${$p}-action-copy`]: !c, [`${$p}-action-copied`]: c });
    return l
      ? l(c, this.copy, this.props)
      : E.createElement(so, { componentName: 'Typography' }, h =>
          E.createElement(
            'span',
            { style: Object.assign({ marginLeft: '4px' }, r), className: d, ref: o },
            c
              ? this.renderSuccessTip()
              : E.createElement(zr, { content: typeof a < 'u' ? a : h.copy }, this.renderCopyIcon())
          )
        );
  }
}
zh.propTypes = {
  content: m.string,
  onCopy: m.func,
  successTip: m.node,
  copyTip: m.node,
  duration: m.number,
  style: m.object,
  className: m.string,
  icon: m.node,
};
zh.defaultProps = { content: '', onCopy: _n, duration: 3, style: {}, className: '' };
const w1 = { PREFIX: `${nr}-popover`, ARROW: `${nr}-popover-icon-arrow` },
  _1 = {
    POSITION_SET: [
      'top',
      'topLeft',
      'topRight',
      'left',
      'leftTop',
      'leftBottom',
      'right',
      'rightTop',
      'rightBottom',
      'bottom',
      'bottomLeft',
      'bottomRight',
      'leftTopOver',
      'rightTopOver',
    ],
    TRIGGER_SET: ['hover', 'focus', 'click', 'custom', 'contextMenu'],
  },
  lo = {
    ARROW_BOUNDING: Object.assign(Object.assign({}, Wn.ARROW_BOUNDING), { offsetY: 6, offsetX: 0, height: 8 }),
    SPACING: 4,
    SPACING_WITH_ARROW: 10,
    DEFAULT_Z_INDEX: 1030,
  };
var QR = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const ZR = function () {
  let i = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const { position: r = '', className: n, arrowStyle: o, popStyle: a } = i,
    l = QR(i, ['position', 'className', 'arrowStyle', 'popStyle']),
    c = r.indexOf('top') === 0 || r.indexOf('bottom') === 0,
    d = de(n, w1.ARROW),
    h = De(o, 'borderOpacity'),
    g = De(o, 'backgroundColor', De(a, 'backgroundColor')),
    y = De(o, 'borderColor', De(a, 'borderColor')),
    w = Object.assign(Object.assign({}, l), {
      width: lo.ARROW_BOUNDING.width,
      height: lo.ARROW_BOUNDING.height,
      xmlns: 'http://www.w3.org/2000/svg',
      className: d,
    });
  return c
    ? E.createElement(
        'svg',
        Object.assign({}, w),
        E.createElement('path', {
          d: 'M0 0.5L0 1.5C4 1.5, 5.5 3, 7.5 5S10,8 12,8S14.5 7, 16.5 5S20,1.5 24,1.5L24 0.5L0 0.5z',
          style: { fill: y, opacity: h },
        }),
        E.createElement('path', {
          d: 'M0 0L0 1C4 1, 5.5 2, 7.5 4S10,7 12,7S14.5  6, 16.5 4S20,1 24,1L24 0L0 0z',
          style: { fill: g },
        })
      )
    : E.createElement(
        'svg',
        Object.assign({}, w),
        E.createElement('path', {
          d: 'M0.5 0L1.5 0C1.5 4, 3 5.5, 5 7.5S8,10 8,12S7 14.5, 5 16.5S1.5,20 1.5,24L0.5 24L0.5 0z',
          style: { fill: y, opacity: h },
        }),
        E.createElement('path', {
          d: 'M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z',
          style: { fill: g },
        })
      );
};
var JR = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const eI = _1.POSITION_SET,
  tI = _1.TRIGGER_SET;
class uo extends E.PureComponent {
  constructor(r) {
    super(r),
      (this.focusTrigger = () => {
        var n;
        (n = this.tooltipRef.current) === null || n === void 0 || n.focusTrigger();
      }),
      (this.renderPopCard = n => {
        let { initialFocusRef: o } = n;
        const { content: a, contentClassName: l, prefixCls: c } = this.props,
          { direction: d } = this.context,
          h = de(c, l, { [`${c}-rtl`]: d === 'rtl' }),
          g = this.renderContentNode({ initialFocusRef: o, content: a });
        return E.createElement('div', { className: h }, E.createElement('div', { className: `${c}-content` }, g));
      }),
      (this.renderContentNode = n => {
        const { initialFocusRef: o, content: a } = n,
          l = { initialFocusRef: o };
        return Dh(a) ? a(l) : a;
      }),
      (this.tooltipRef = E.createRef());
  }
  render() {
    const r = this.props,
      {
        children: n,
        prefixCls: o,
        showArrow: a,
        arrowStyle: l = {},
        arrowBounding: c,
        position: d,
        style: h,
        trigger: g,
      } = r,
      y = JR(r, ['children', 'prefixCls', 'showArrow', 'arrowStyle', 'arrowBounding', 'position', 'style', 'trigger']);
    let { spacing: w } = this.props;
    const S = { position: d, className: '', popStyle: h, arrowStyle: l },
      _ = a ? E.createElement(ZR, Object.assign({}, S)) : !1;
    en(w) && (w = a ? lo.SPACING_WITH_ARROW : lo.SPACING);
    const x = g === 'click' || g === 'custom' ? 'dialog' : 'tooltip';
    return E.createElement(
      zr,
      Object.assign({ guardFocus: !0, ref: this.tooltipRef }, y, {
        trigger: g,
        position: d,
        style: h,
        content: this.renderPopCard,
        prefixCls: o,
        spacing: w,
        showArrow: _,
        arrowBounding: c,
        role: x,
      }),
      n
    );
  }
}
uo.contextType = _l;
uo.propTypes = {
  children: m.node,
  content: m.oneOfType([m.node, m.func]),
  visible: m.bool,
  autoAdjustOverflow: m.bool,
  motion: m.bool,
  position: m.oneOf(eI),
  margin: m.oneOfType([m.number, m.object]),
  mouseEnterDelay: m.number,
  mouseLeaveDelay: m.number,
  trigger: m.oneOf(tI).isRequired,
  contentClassName: m.oneOfType([m.string, m.array]),
  onVisibleChange: m.func,
  onClickOutSide: m.func,
  style: m.object,
  spacing: m.oneOfType([m.number, m.object]),
  zIndex: m.number,
  showArrow: m.bool,
  arrowStyle: m.shape({
    borderColor: m.string,
    backgroundColor: m.string,
    borderOpacity: m.oneOfType([m.string, m.number]),
  }),
  arrowPointAtCenter: m.bool,
  arrowBounding: m.object,
  prefixCls: m.string,
  guardFocus: m.bool,
  disableArrowKeyDown: m.bool,
};
uo.__SemiComponentName__ = 'Popover';
uo.defaultProps = Pi(uo.__SemiComponentName__, {
  arrowBounding: lo.ARROW_BOUNDING,
  showArrow: !1,
  autoAdjustOverflow: !0,
  zIndex: lo.DEFAULT_Z_INDEX,
  motion: !0,
  trigger: 'hover',
  cancelText: 'No',
  okText: 'Yes',
  position: 'bottom',
  prefixCls: w1.PREFIX,
  onClickOutSide: ze,
  onEscKeyDown: ze,
  closeOnEsc: !0,
  returnFocusOnClose: !0,
  guardFocus: !0,
  disableFocusListener: !0,
});
let nt;
function zp(i) {
  if (!i) return 0;
  const r = i.match(/^\d*(\.\d*)?/);
  return r ? Number(r[0]) : 0;
}
function rI(i) {
  return Array.prototype.slice
    .apply(i)
    .map(n => `${n}: ${i.getPropertyValue(n)};`)
    .join('');
}
const nI = function (i, r) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : '',
      o = arguments.length > 3 ? arguments[3] : void 0,
      a = arguments.length > 4 ? arguments[4] : void 0,
      l = arguments.length > 5 ? arguments[5] : void 0,
      c = arguments.length > 6 ? arguments[6] : void 0,
      d = arguments.length > 7 ? arguments[7] : void 0;
    if (n.length === 0) return '';
    nt || ((nt = document.createElement('div')), nt.setAttribute('aria-hidden', 'true'), document.body.appendChild(nt));
    const h = window.getComputedStyle(i),
      g = rI(h),
      y = zp(h.lineHeight),
      w = Math.round(y * (r + 1) + zp(h.paddingTop) + zp(h.paddingBottom));
    nt.setAttribute('style', g),
      (nt.style.position = 'fixed'),
      (nt.style.left = '0'),
      h.getPropertyValue('width') === 'auto' && i.offsetWidth && (nt.style.width = `${i.offsetWidth}px`),
      (nt.style.height = 'auto'),
      (nt.style.top = '-999999px'),
      (nt.style.zIndex = '-1000'),
      d && (nt.style.fontWeight = '600'),
      (nt.style.textOverflow = 'clip'),
      (nt.style.webkitLineClamp = 'none'),
      (nt.innerHTML = '');
    function S() {
      const $ = nt.scrollWidth <= nt.offsetWidth,
        H = nt.scrollHeight < w;
      return r === 1 ? $ && H : H;
    }
    const _ = document.createElement('span'),
      x = document.createTextNode(n);
    if ((_.appendChild(x), l.length > 0)) {
      const $ = document.createTextNode(l);
      _.appendChild($);
    }
    nt.appendChild(_), Object.values(yo(o, 'expand')).map($ => $ && nt.appendChild($.cloneNode(!0)));
    function T() {
      (nt.innerHTML = ''), nt.appendChild(_), Object.values(o).map($ => $ && nt.appendChild($.cloneNode(!0)));
    }
    function O($, H) {
      const V = $.length;
      return H ? (c === 'end' ? $.slice(0, H) + a : $.slice(0, H) + a + $.slice(V - H, V)) : a;
    }
    function L($, H) {
      let V = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0,
        F = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : H.length,
        b = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 0;
      const q = Math.floor((V + F) / 2),
        W = O(H, q);
      if ((($.textContent = W), V >= F - 1 && F > 0))
        for (let X = F; X >= V; X -= 1) {
          const G = O(H, X);
          if ((($.textContent = G), S())) return G;
        }
      else if (F === 0) return a;
      return S() ? L($, H, q, F, q) : L($, H, V, q, b);
    }
    let I = n;
    return S() || (T(), (I = L(x, n, 0, c === 'middle' ? Math.floor(n.length / 2) : n.length))), (nt.innerHTML = ''), I;
  },
  S1 = E.createContext('normal');
var nl;
(function (i) {
  (i.Width = 'width'), (i.Height = 'height'), (i.All = 'all');
})(nl || (nl = {}));
class qh extends Rr {
  constructor(r) {
    var n;
    super(r),
      (n = this),
      (this.formerPropertyValue = new Map()),
      (this.getElement = () => {
        try {
          return xa.findDOMNode(this.childNode || this);
        } catch {
          return null;
        }
      }),
      (this.handleResizeEventTriggered = o => {
        var a, l, c, d;
        if (this.props.observerProperty === nl.All)
          (l = (a = this.props).onResize) === null || l === void 0 || l.call(a, o);
        else {
          const h = [];
          for (const g of o)
            this.formerPropertyValue.has(g.target)
              ? g.contentRect[this.props.observerProperty] !== this.formerPropertyValue.get(g.target) &&
                (this.formerPropertyValue.set(g.target, g.contentRect[this.props.observerProperty]), h.push(g))
              : (this.formerPropertyValue.set(g.target, g.contentRect[this.props.observerProperty]), h.push(g));
          h.length > 0 && ((d = (c = this.props).onResize) === null || d === void 0 || d.call(c, h));
        }
      }),
      (this.observeElement = function () {
        let o = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !1;
        const a = n.getElement();
        if (
          (n.observer || (n.observer = new ResizeObserver(n.handleResizeEventTriggered)), !(a && a instanceof Element))
        ) {
          n.observer.disconnect();
          return;
        }
        (a === n.element && !o) ||
          (n.observer.disconnect(),
          (n.element = a),
          n.observer.observe(a),
          n.props.observeParent &&
            a.parentNode &&
            a.parentNode.ownerDocument &&
            a.parentNode.ownerDocument.defaultView &&
            a.parentNode instanceof a.parentNode.ownerDocument.defaultView.HTMLElement &&
            ((n._parentNode = a.parentNode), n.observer.observe(n._parentNode)));
      }),
      (this.mergeRef = (o, a) => {
        (this.childNode = a),
          typeof o == 'function' ? o(a) : typeof o == 'object' && o && 'current' in o && (o.current = a);
      }),
      globalThis.ResizeObserver && (this.observer = new ResizeObserver(this.handleResizeEventTriggered));
  }
  componentDidMount() {
    var r;
    (r = this.observeElement) === null || r === void 0 || r.call(this);
  }
  componentDidUpdate(r) {
    var n;
    (n = this.observeElement) === null || n === void 0 || n.call(this, this.props.observeParent !== r.observeParent);
  }
  componentWillUnmount() {
    this.observer && (this.observer.disconnect(), (this.observer = null), (this.element = null));
  }
  render() {
    const r = E.Children.only(this.props.children),
      { ref: n } = r;
    return E.cloneElement(r, { ref: o => this.mergeRef(n, o) });
  }
}
qh.propTypes = { onResize: m.func, observeParent: m.bool, observerProperty: m.string, delayTick: m.number };
qh.defaultProps = { onResize: () => {}, observeParent: !1, observerProperty: 'all', delayTick: 0 };
var qp = function (i, r, n, o) {
    function a(l) {
      return l instanceof n
        ? l
        : new n(function (c) {
            c(l);
          });
    }
    return new (n || (n = Promise))(function (l, c) {
      function d(y) {
        try {
          g(o.next(y));
        } catch (w) {
          c(w);
        }
      }
      function h(y) {
        try {
          g(o.throw(y));
        } catch (w) {
          c(w);
        }
      }
      function g(y) {
        y.done ? l(y.value) : a(y.value).then(d, h);
      }
      g((o = o.apply(i, r || [])).next());
    });
  },
  iI = function (i, r) {
    var n = {};
    for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
    if (i != null && typeof Object.getOwnPropertySymbols == 'function')
      for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
        r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
    return n;
  };
const Pt = vl.PREFIX,
  oI = '...',
  aI = (i, r) => {
    const { mark: n, code: o, underline: a, strong: l, link: c, disabled: d } = i;
    let h = r;
    const g = (y, w) => {
      let S = {};
      y && (typeof y == 'object' && (S = Object.assign({}, y)), (h = E.createElement(w, S, h)));
    };
    return g(n, 'mark'), g(o, 'code'), g(a && !c, 'u'), g(l, 'strong'), g(i.delete, 'del'), g(c, d ? 'span' : 'a'), h;
  };
class Ri extends A.Component {
  constructor(r) {
    super(r),
      (this.observerTakingEffect = !1),
      (this.onResize = n =>
        qp(this, void 0, void 0, function* () {
          return (
            this.rafId && window.cancelAnimationFrame(this.rafId),
            new Promise(o => {
              this.rafId = window.requestAnimationFrame(() =>
                qp(this, void 0, void 0, function* () {
                  yield this.getEllipsisState(), o();
                })
              );
            })
          );
        })),
      (this.canUseCSSEllipsis = () => {
        const { copyable: n } = this.props,
          { expandable: o, expandText: a, pos: l, suffix: c } = this.getEllipsisOpt();
        return !o && Ws(a) && !n && l === 'end' && !c.length;
      }),
      (this.shouldTruncated = n =>
        !n || n < 1
          ? !1
          : n <= 1
          ? this.compareSingleRow()
          : this.wrapperRef.current.scrollHeight > this.wrapperRef.current.offsetHeight),
      (this.compareSingleRow = () => {
        if (!(document && document.createRange)) return !1;
        const n = this.wrapperRef.current,
          o = n.getBoundingClientRect().width,
          a = Array.from(n.childNodes),
          l = document.createRange(),
          c = a.reduce((d, h) => {
            var g;
            return (
              l.selectNodeContents(h), d + ((g = l.getBoundingClientRect().width) !== null && g !== void 0 ? g : 0)
            );
          }, 0);
        return l.detach(), c > o;
      }),
      (this.showTooltip = () => {
        var n, o;
        const { isOverflowed: a, isTruncated: l, expanded: c } = this.state,
          { showTooltip: d, expandable: h, expandText: g } = this.getEllipsisOpt(),
          y = this.canUseCSSEllipsis(),
          w = !c && (y ? a : l),
          _ = !h && Ws(g) && w && d;
        if (!_) return _;
        const x = { type: 'tooltip' };
        return typeof d == 'object'
          ? d.type && d.type.toLowerCase() === 'popover'
            ? UP({ opts: { showArrow: !0 } }, d, {
                opts: {
                  className: de({
                    [`${Pt}-ellipsis-popover`]: !0,
                    [(n = d?.opts) === null || n === void 0 ? void 0 : n.className]: !!(
                      !((o = d?.opts) === null || o === void 0) && o.className
                    ),
                  }),
                },
              })
            : Object.assign(Object.assign({}, x), d)
          : x;
      }),
      (this.onHover = () => {
        if (this.canUseCSSEllipsis()) {
          const { rows: o, suffix: a, pos: l } = this.getEllipsisOpt(),
            c = this.shouldTruncated(o);
          this.setState({ isOverflowed: c, isTruncated: !1 });
          return;
        }
      }),
      (this.getEllipsisState = () =>
        qp(this, void 0, void 0, function* () {
          const { rows: n, suffix: o, pos: a } = this.getEllipsisOpt(),
            { children: l, strong: c } = this.props;
          if (!this.wrapperRef || !this.wrapperRef.current) {
            yield this.onResize();
            return;
          }
          const { expanded: d } = this.state;
          if (this.canUseCSSEllipsis()) return;
          if (IP(l))
            return new Promise(S => {
              this.setState({ isTruncated: !1, isOverflowed: !1 }, S);
            });
          if (
            (_a(
              'children' in this.props && typeof l != 'string',
              '[Semi Typography] Only children with pure text could be used with ellipsis at this moment.'
            ),
            !n || n < 0 || d)
          )
            return;
          const g = { expand: this.expandRef.current, copy: this.copyRef && this.copyRef.current },
            y = Array.isArray(l) ? l.join('') : String(l),
            w = nI(this.wrapperRef.current, n, y, g, oI, o, a, c);
          return new Promise(S => {
            this.setState({ isOverflowed: !1, ellipsisContent: w, isTruncated: y !== w }, S);
          });
        })),
      (this.toggleOverflow = n => {
        const { onExpand: o, expandable: a, collapsible: l } = this.getEllipsisOpt(),
          { expanded: c } = this.state;
        o && o(!c, n), ((a && !c) || (l && c)) && this.setState({ expanded: !c });
      }),
      (this.getEllipsisOpt = () => {
        const { ellipsis: n } = this.props;
        return n
          ? Object.assign(
              {
                rows: 1,
                expandable: !1,
                pos: 'end',
                suffix: '',
                showTooltip: !1,
                collapsible: !1,
                expandText: n.expandable ? this.expandStr : void 0,
                collapseText: n.collapsible ? this.collapseStr : void 0,
              },
              typeof n == 'object' ? n : null
            )
          : {};
      }),
      (this.renderExpandable = () => {
        const { expanded: n, isTruncated: o } = this.state;
        if (!o) return null;
        const { expandText: a, expandable: l, collapseText: c, collapsible: d } = this.getEllipsisOpt(),
          h = !l && Ws(a),
          g = !d && Ws(c);
        let y;
        return (
          !n && !h ? (y = a) : n && !g && (y = c),
          !h || !g
            ? E.createElement(
                'a',
                {
                  role: 'button',
                  tabIndex: 0,
                  className: `${Pt}-ellipsis-expand`,
                  key: 'expand',
                  ref: this.expandRef,
                  'aria-label': y,
                  onClick: this.toggleOverflow,
                  onKeyPress: w => El(w) && this.toggleOverflow(w),
                },
                y
              )
            : null
        );
      }),
      (this.getEllipsisStyle = () => {
        const { ellipsis: n, component: o } = this.props;
        if (!n) return { ellipsisCls: '', ellipsisStyle: {} };
        const { rows: a } = this.getEllipsisOpt(),
          { expanded: l } = this.state,
          c = !l && this.canUseCSSEllipsis(),
          d = de({
            [`${Pt}-ellipsis`]: !0,
            [`${Pt}-ellipsis-single-line`]: a === 1,
            [`${Pt}-ellipsis-multiple-line`]: a > 1,
            [`${Pt}-ellipsis-multiple-line-text`]: a > 1 && o === 'span',
            [`${Pt}-ellipsis-overflow-ellipsis`]: a === 1 && c,
            [`${Pt}-ellipsis-overflow-ellipsis-text`]: a === 1 && c && o === 'span',
          }),
          h = c && a > 1 ? { WebkitLineClamp: a } : {};
        return { ellipsisCls: d, ellipsisStyle: h };
      }),
      (this.renderEllipsisText = n => {
        const { suffix: o } = n,
          { children: a } = this.props,
          { isTruncated: l, expanded: c, ellipsisContent: d } = this.state;
        return c || !l
          ? E.createElement('span', { onMouseEnter: this.onHover }, a, o && o.length ? o : null)
          : E.createElement('span', { onMouseEnter: this.onHover }, d, o);
      }),
      (this.state = {
        editable: !1,
        copied: !1,
        isOverflowed: !1,
        ellipsisContent: r.children,
        expanded: !1,
        isTruncated: !1,
        prevChildren: null,
      }),
      (this.wrapperRef = E.createRef()),
      (this.expandRef = E.createRef()),
      (this.copyRef = E.createRef());
  }
  componentDidMount() {
    this.props.ellipsis && this.onResize().then(() => Mh(() => (this.observerTakingEffect = !0), 1));
  }
  static getDerivedStateFromProps(r, n) {
    const { prevChildren: o } = n,
      a = {};
    return (
      (a.prevChildren = r.children),
      r.ellipsis &&
        o !== r.children &&
        ((a.isOverflowed = !1), (a.ellipsisContent = r.children), (a.expanded = !1), (a.isTruncated = !0)),
      a
    );
  }
  componentDidUpdate(r) {
    this.props.children !== r.children && (this.forceUpdate(), this.props.ellipsis && this.onResize());
  }
  componentWillUnmount() {
    this.rafId && window.cancelAnimationFrame(this.rafId);
  }
  renderOperations() {
    return E.createElement(E.Fragment, null, this.renderExpandable(), this.renderCopy());
  }
  renderCopy() {
    var r;
    const { copyable: n, children: o } = this.props;
    if (!n) return null;
    const a = (r = n?.content) !== null && r !== void 0 ? r : o;
    let l,
      c = !1;
    Array.isArray(a)
      ? ((l = ''),
        a.forEach(h => {
          typeof h == 'object' && (c = !0), (l += String(h));
        }))
      : (typeof a != 'object' || (c = !0), (l = String(a))),
      _a(
        c,
        'Content to be copied in Typography is a object, it will case a [object Object] mistake when copy to clipboard.'
      );
    const d = Object.assign({ content: l, duration: 3 }, typeof n == 'object' ? n : null);
    return E.createElement(zh, Object.assign({}, d, { forwardRef: this.copyRef }));
  }
  renderIcon() {
    const { icon: r, size: n } = this.props,
      o = n === 'inherit' ? this.context : n;
    if (!r) return null;
    const a = o === 'small' ? 'small' : 'default';
    return E.createElement(
      'span',
      { className: `${Pt}-icon`, 'x-semi-prop': 'icon' },
      y1(r) ? E.cloneElement(r, { size: a }) : r
    );
  }
  renderContent() {
    const r = this.props,
      {
        component: n,
        children: o,
        className: a,
        type: l,
        spacing: c,
        disabled: d,
        style: h,
        ellipsis: g,
        icon: y,
        size: w,
        link: S,
        heading: _,
        weight: x,
      } = r,
      T = iI(r, [
        'component',
        'children',
        'className',
        'type',
        'spacing',
        'disabled',
        'style',
        'ellipsis',
        'icon',
        'size',
        'link',
        'heading',
        'weight',
      ]),
      O = yo(T, ['strong', 'editable', 'mark', 'copyable', 'underline', 'code', 'delete']),
      L = w === 'inherit' ? this.context : w,
      I = this.renderIcon(),
      $ = this.getEllipsisOpt(),
      { ellipsisCls: H, ellipsisStyle: V } = this.getEllipsisStyle();
    let F = g ? this.renderEllipsisText($) : o;
    const b = de({ [`${Pt}-link-text`]: S, [`${Pt}-link-underline`]: this.props.underline && S });
    F = aI(
      this.props,
      E.createElement(E.Fragment, null, I, this.props.link ? E.createElement('span', { className: b }, F) : F)
    );
    const q = /^h[1-6]$/,
      W = ga(_) && q.test(_),
      X = de(a, H, {
        [`${Pt}-${l}`]: l && !S,
        [`${Pt}-${L}`]: L,
        [`${Pt}-link`]: S,
        [`${Pt}-disabled`]: d,
        [`${Pt}-${c}`]: c,
        [`${Pt}-${_}`]: W,
        [`${Pt}-${_}-weight-${x}`]: W && x && isNaN(Number(x)),
      }),
      G = Object.assign(Object.assign({}, isNaN(Number(x)) ? {} : { fontWeight: x }), h);
    return E.createElement(
      wl,
      Object.assign(
        {
          tooltipRef: this.wrapperRef,
          className: X,
          style: Object.assign(Object.assign({}, G), V),
          component: n,
          forwardRef: this.wrapperRef,
        },
        O
      ),
      F,
      this.renderOperations()
    );
  }
  renderTipWrapper() {
    const { children: r } = this.props,
      n = this.showTooltip(),
      o = this.renderContent();
    if (n) {
      const { type: a, opts: l, renderTooltip: c } = n;
      return Dh(c)
        ? c(r, o)
        : a.toLowerCase() === 'popover'
        ? E.createElement(uo, Object.assign({ content: r, position: 'top' }, l), o)
        : E.createElement(zr, Object.assign({ content: r, position: 'top' }, l), o);
    } else return o;
  }
  render() {
    var r = this;
    const { size: n } = this.props,
      o = n === 'inherit' ? this.context : n,
      a = E.createElement(
        S1.Provider,
        { value: o },
        E.createElement(
          so,
          { componentName: 'Typography' },
          l => ((this.expandStr = l.expand), (this.collapseStr = l.collapse), this.renderTipWrapper())
        )
      );
    return this.props.ellipsis
      ? E.createElement(
          qh,
          {
            onResize: function () {
              r.observerTakingEffect && r.onResize(...arguments);
            },
            observeParent: !0,
            observerProperty: nl.Width,
          },
          a
        )
      : a;
  }
}
Ri.propTypes = {
  children: m.node,
  copyable: m.oneOfType([m.shape({ text: m.string, onCopy: m.func, successTip: m.node, copyTip: m.node }), m.bool]),
  delete: m.bool,
  disabled: m.bool,
  ellipsis: m.oneOfType([
    m.shape({
      rows: m.number,
      expandable: m.bool,
      expandText: m.string,
      onExpand: m.func,
      suffix: m.string,
      showTooltip: m.oneOfType([m.shape({ type: m.string, opts: m.object }), m.bool]),
      collapsible: m.bool,
      collapseText: m.string,
      pos: m.oneOf(['end', 'middle']),
    }),
    m.bool,
  ]),
  mark: m.bool,
  underline: m.bool,
  link: m.oneOfType([m.object, m.bool]),
  spacing: m.oneOf(qt.SPACING),
  strong: m.bool,
  size: m.oneOf(qt.SIZE),
  type: m.oneOf(qt.TYPE),
  style: m.object,
  className: m.string,
  icon: m.oneOfType([m.node, m.string]),
  heading: m.string,
  component: m.string,
};
Ri.defaultProps = {
  children: null,
  copyable: !1,
  delete: !1,
  disabled: !1,
  ellipsis: !1,
  icon: '',
  mark: !1,
  underline: !1,
  strong: !1,
  link: !1,
  type: 'primary',
  spacing: 'normal',
  size: 'normal',
  style: {},
  className: '',
};
Ri.contextType = S1;
class Bh extends A.PureComponent {
  render() {
    return E.createElement(Ri, Object.assign({ component: 'span' }, this.props));
  }
}
Bh.propTypes = {
  copyable: m.oneOfType([m.object, m.bool]),
  delete: m.bool,
  disabled: m.bool,
  icon: m.oneOfType([m.node, m.string]),
  ellipsis: m.oneOfType([m.object, m.bool]),
  mark: m.bool,
  underline: m.bool,
  link: m.oneOfType([m.object, m.bool]),
  strong: m.bool,
  type: m.oneOf(qt.TYPE),
  size: m.oneOf(qt.SIZE),
  style: m.object,
  className: m.string,
  code: m.bool,
  component: m.string,
  weight: m.number,
};
Bh.defaultProps = {
  copyable: !1,
  delete: !1,
  disabled: !1,
  icon: '',
  ellipsis: !1,
  mark: !1,
  underline: !1,
  strong: !1,
  link: !1,
  type: 'primary',
  style: {},
  size: 'normal',
  className: '',
};
var sI = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
let Uh = class extends A.PureComponent {
  render() {
    const r = this.props,
      { heading: n } = r,
      o = sI(r, ['heading']),
      a = qt.HEADING.indexOf(n) !== -1 ? `h${n}` : 'h1';
    return E.createElement(Ri, Object.assign({ component: a, heading: a }, o));
  }
};
Uh.propTypes = {
  copyable: m.oneOfType([m.object, m.bool]),
  delete: m.bool,
  disabled: m.bool,
  ellipsis: m.oneOfType([m.object, m.bool]),
  mark: m.bool,
  link: m.oneOfType([m.object, m.bool]),
  underline: m.bool,
  strong: m.bool,
  type: m.oneOf(qt.TYPE),
  heading: m.oneOf(qt.HEADING),
  style: m.object,
  className: m.string,
  component: m.string,
  weight: m.oneOfType([m.oneOf(qt.WEIGHT), m.number]),
};
Uh.defaultProps = {
  copyable: !1,
  delete: !1,
  disabled: !1,
  ellipsis: !1,
  mark: !1,
  underline: !1,
  strong: !1,
  link: !1,
  type: 'primary',
  heading: 1,
  style: {},
  className: '',
};
const lI = vl.PREFIX;
let Hh = class extends A.PureComponent {
  render() {
    const { className: r } = this.props,
      n = de(r, `${lI}-paragraph`);
    return E.createElement(Ri, Object.assign({ component: 'p' }, this.props, { className: n }));
  }
};
Hh.propTypes = {
  copyable: m.oneOfType([m.object, m.bool]),
  delete: m.bool,
  disabled: m.bool,
  ellipsis: m.oneOfType([m.object, m.bool]),
  mark: m.bool,
  link: m.oneOfType([m.object, m.bool]),
  underline: m.bool,
  strong: m.bool,
  type: m.oneOf(qt.TYPE),
  size: m.oneOf(qt.SIZE),
  spacing: m.oneOf(qt.SPACING),
  style: m.object,
  className: m.string,
  component: m.string,
};
Hh.defaultProps = {
  copyable: !1,
  delete: !1,
  disabled: !1,
  ellipsis: !1,
  mark: !1,
  underline: !1,
  strong: !1,
  link: !1,
  type: 'primary',
  size: 'normal',
  spacing: 'normal',
  style: {},
  className: '',
};
class uI {
  constructor(r, n, o, a, l) {
    (this.ruleMethods = {
      'bytes-decimal': c => {
        const d = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let h = 0;
        for (; c >= 1e3; ) (c /= 1e3), h++;
        return `${this.truncatePrecision(c)} ${d[h]}`;
      },
      'bytes-binary': c => {
        const d = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        let h = 0;
        for (; c >= 1024; ) (c /= 1024), h++;
        return `${this.truncatePrecision(c)} ${d[h]}`;
      },
      percentages: c => `${this.truncatePrecision(c * 100)}%`,
      exponential: c => {
        const h = c.toExponential(this.precision + 2).split('e');
        return `${this.truncatePrecision(Number(h[0]))}e${h[1]}`;
      },
    }),
      (this.truncateMethods = { ceil: Math.ceil, floor: Math.floor, round: Math.round }),
      (this.isDiyParser = typeof l < 'u'),
      (this.content = r),
      (this.rule = n),
      (this.precision = o),
      (this.truncate = a),
      (this.parser = l);
  }
  format() {
    return this.isDiyParser
      ? this.parser(this.content)
      : this.rule === 'text'
      ? Bp(this.content)
          .map(r => (Up(r) ? this.truncatePrecision(r) : r))
          .join('')
      : this.rule === 'numbers'
      ? Bp(this.content)
          .filter(r => Up(r))
          .map(r => this.truncatePrecision(r))
          .join(',')
      : Bp(this.content)
          .map(r => (Up(r) ? this.ruleMethods[this.rule](Number(r)) : r))
          .join('');
  }
  truncatePrecision(r) {
    const n =
        this.truncateMethods[this.truncate](Number(r) * Math.pow(10, this.precision)) / Math.pow(10, this.precision),
      o = n.toString().split('.');
    if (o.length === 1) return n.toFixed(this.precision);
    const a = o[1].length;
    return a < this.precision ? `${o[0]}.${o[1]}${'0'.repeat(this.precision - a)}` : n.toString();
  }
}
function Bp(i) {
  const r = /(-?[0-9]*\.?[0-9]+([eE]-?[0-9]+)?)|([^-\d\.]+)/g;
  return i.match(r) || [];
}
function Up(i) {
  return !(isNaN(Number(i)) || i.replace(/\s+/g, '') === '');
}
class Kh extends A.PureComponent {
  formatNodeDFS(r) {
    return (
      Array.isArray(r) || (r = [r]),
      (r = r.map(n =>
        typeof n == 'string' || typeof n == 'number'
          ? new uI(String(n), this.props.rule, this.props.precision, this.props.truncate, this.props.parser).format()
          : typeof n == 'function'
          ? this.formatNodeDFS(n())
          : typeof n == 'object' && 'children' in n.props
          ? Object.assign(Object.assign({}, n), {
              props: Object.assign(Object.assign({}, n.props), { children: this.formatNodeDFS(n.props.children) }),
            })
          : n
      )),
      r.length === 1 ? r[0] : r
    );
  }
  render() {
    const r = Object.assign({}, this.props);
    return (
      delete r.rule,
      delete r.parser,
      (r.children = this.formatNodeDFS(this.props.children)),
      E.createElement(Ri, Object.assign({ component: 'span' }, r))
    );
  }
}
Kh.propTypes = {
  rule: m.oneOf(qt.RULE),
  precision: m.number,
  truncate: m.oneOf(qt.TRUNCATE),
  parser: m.func,
  copyable: m.oneOfType([m.object, m.bool]),
  delete: m.bool,
  disabled: m.bool,
  icon: m.oneOfType([m.node, m.string]),
  mark: m.bool,
  underline: m.bool,
  link: m.oneOfType([m.object, m.bool]),
  strong: m.bool,
  type: m.oneOf(qt.TYPE),
  size: m.oneOf(qt.SIZE),
  style: m.object,
  className: m.string,
  code: m.bool,
  component: m.string,
};
Kh.defaultProps = {
  rule: 'text',
  precision: 0,
  truncate: 'round',
  parser: void 0,
  copyable: !1,
  delete: !1,
  icon: '',
  mark: !1,
  underline: !1,
  strong: !1,
  link: !1,
  type: 'primary',
  style: {},
  size: 'normal',
  className: '',
};
const Aa = wl;
Aa.Text = Bh;
Aa.Title = Uh;
Aa.Paragraph = Hh;
Aa.Numeral = Kh;
var Hp, D_;
function cI() {
  if (D_) return Hp;
  D_ = 1;
  var i = ei(),
    r = Br(),
    n = '[object Number]';
  function o(a) {
    return typeof a == 'number' || (r(a) && i(a) == n);
  }
  return (Hp = o), Hp;
}
var dI = cI();
const Kp = ut(dI);
var fI = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
let M_ = -1;
function pI() {
  let i = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const { id: r, className: n, customIconCls: o } = i,
    a = fI(i, ['id', 'className', 'customIconCls']),
    l = De(el, 'config.overrideDefaultProps.Spin.indicator');
  if (l && E.isValidElement(l)) return E.cloneElement(l, { className: de({ [o]: o, [n]: n }) });
  let c = r;
  en(c) && (M_++, (c = M_));
  const d = `linearGradient-${c}`;
  return E.createElement(
    'svg',
    Object.assign({}, a, {
      className: n,
      width: '48',
      height: '48',
      viewBox: '0 0 36 36',
      version: '1.1',
      xmlns: 'http://www.w3.org/2000/svg',
      'aria-hidden': !0,
      'data-icon': 'spin',
    }),
    E.createElement(
      'defs',
      null,
      E.createElement(
        'linearGradient',
        { x1: '0%', y1: '100%', x2: '100%', y2: '100%', id: d },
        E.createElement('stop', { stopColor: 'currentColor', stopOpacity: '0', offset: '0%' }),
        E.createElement('stop', { stopColor: 'currentColor', stopOpacity: '0.50', offset: '39.9430698%' }),
        E.createElement('stop', { stopColor: 'currentColor', offset: '100%' })
      )
    ),
    E.createElement(
      'g',
      { stroke: 'none', strokeWidth: '1', fill: 'none', fillRule: 'evenodd' },
      E.createElement('rect', { fillOpacity: '0.01', fill: 'none', x: '0', y: '0', width: '36', height: '36' }),
      E.createElement('path', {
        d: 'M34,18 C34,9.163444 26.836556,2 18,2 C11.6597233,2 6.18078805,5.68784135 3.59122325,11.0354951',
        stroke: `url(#${d})`,
        strokeWidth: '4',
        strokeLinecap: 'round',
      })
    )
  );
}
const hI = { PREFIX: `${nr}-avatar` },
  vo = {
    SHAPE: ['circle', 'square'],
    SIZE: ['extra-extra-small', 'extra-small', 'small', 'default', 'medium', 'large', 'extra-large'],
    COLOR: [
      'grey',
      'red',
      'pink',
      'purple',
      'violet',
      'indigo',
      'blue',
      'light-blue',
      'cyan',
      'teal',
      'green',
      'light-green',
      'lime',
      'yellow',
      'amber',
      'orange',
      'white',
    ],
  };
class mI extends nn {
  constructor(r) {
    super(Object.assign({}, r)),
      (this.handleFocusVisible = n => {
        const { target: o } = n;
        try {
          o.matches(':focus-visible') && this._adapter.setFocusVisible(!0);
        } catch {
          _a(!0, 'Warning: [Semi Avatar] The current browser does not support the focus-visible');
        }
      }),
      (this.handleBlur = () => {
        this._adapter.setFocusVisible(!1);
      }),
      (this.changeScale = () => {
        const { gap: n } = this.getProps(),
          o = this._adapter.getAvatarNode(),
          a = o?.firstChild,
          [l, c] = [o?.offsetWidth || 0, a?.offsetWidth || 0];
        if (l !== 0 && c !== 0 && n * 2 < l) {
          const d = l - n * 2 > c ? 1 : (l - n * 2) / c;
          this._adapter.setScale(d);
        }
      });
  }
  init() {
    const { children: r } = this.getProps();
    typeof r == 'string' && this.changeScale();
  }
  destroy() {}
  handleImgLoadError() {
    const { onError: r } = this.getProps();
    (r ? r() : void 0) !== !1 && this._adapter.notifyImgState(!1);
  }
  handleEnter(r) {
    this._adapter.notifyEnter(r);
  }
  handleLeave(r) {
    this._adapter.notifyLeave(r);
  }
}
const gI = i => {
  let { gradientStart: r, gradientEnd: n } = i;
  const o = m1();
  return E.createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', width: '51', height: '52', viewBox: '0 0 51 52', fill: 'none' },
    E.createElement(
      'g',
      { filter: 'url(#filter0_d_6_2)' },
      E.createElement('path', {
        d: 'M40.4918 46.5592C44.6795 43.176 46.261 34.1333 47.5301 25.6141C49.5854 11.8168 39.6662 1 25.8097 1C11.2857 1 3 11.4279 3 25.3518C3 33.7866 6.29361 43.8947 10.4602 46.5592C12.5868 47.9192 12.5868 47.9051 25.8097 47.9192C38.3651 47.9282 38.5352 48.14 40.4918 46.5592Z',
        fill: `url(#${o})`,
      })
    ),
    E.createElement(
      'defs',
      null,
      E.createElement(
        'filter',
        {
          id: 'filter0_d_6_2',
          x: '0.789215',
          y: '0.447304',
          width: '49.2216',
          height: '51.3549',
          filterUnits: 'userSpaceOnUse',
          colorInterpolationFilters: 'sRGB',
        },
        E.createElement('feFlood', { floodOpacity: '0', result: 'BackgroundImageFix' }),
        E.createElement('feColorMatrix', {
          in: 'SourceAlpha',
          type: 'matrix',
          values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0',
          result: 'hardAlpha',
        }),
        E.createElement('feOffset', { dy: '1.65809' }),
        E.createElement('feGaussianBlur', { stdDeviation: '1.10539' }),
        E.createElement('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0' }),
        E.createElement('feBlend', { mode: 'normal', in2: 'BackgroundImageFix', result: 'effect1_dropShadow_6_2' }),
        E.createElement('feBlend', {
          mode: 'normal',
          in: 'SourceGraphic',
          in2: 'effect1_dropShadow_6_2',
          result: 'shape',
        })
      ),
      E.createElement(
        'linearGradient',
        { id: o, x1: '17.671', y1: '31.7392', x2: '17.671', y2: '47.9333', gradientUnits: 'userSpaceOnUse' },
        E.createElement('stop', { stopColor: r }),
        E.createElement('stop', { offset: '1', stopColor: n })
      )
    )
  );
};
var yI = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const vI = vo.SIZE,
  wI = vo.SHAPE,
  _I = vo.COLOR,
  He = hI.PREFIX;
let co = class extends Rr {
  constructor(r) {
    super(r),
      (this.handleFocusVisible = n => {
        this.foundation.handleFocusVisible(n);
      }),
      (this.handleBlur = n => {
        this.foundation.handleBlur();
      }),
      (this.getContent = () => {
        const { children: n, onClick: o, imgAttr: a, src: l, srcSet: c, alt: d } = this.props,
          { isImgExist: h } = this.state;
        let g = n;
        const y = o !== _n,
          w = l && h,
          S = { tabIndex: 0, onKeyDown: this.handleKeyDown, onFocus: this.handleFocusVisible, onBlur: this.handleBlur };
        if (w) {
          const _ = y ? `clickable Avatar: ${d}` : d,
            x = Object.assign(Object.assign({ src: l, srcSet: c, onError: this.handleError }, a), {
              className: de({ [`${He}-no-focus-visible`]: y }),
            }),
            T = y ? Object.assign(Object.assign({}, x), S) : x;
          g = E.createElement('img', Object.assign({ alt: _ }, T));
        } else if (typeof n == 'string') {
          const _ = d ?? n,
            T = {
              role: 'img',
              'aria-label': y ? `clickable Avatar: ${_}` : _,
              className: de(`${He}-label`, { [`${He}-no-focus-visible`]: y }),
            },
            O = y ? Object.assign(Object.assign({}, T), S) : T,
            L = { transform: `scale(${this.state.scale})` };
          g = E.createElement(
            'span',
            { className: `${He}-content`, style: L },
            E.createElement('span', Object.assign({}, O, { 'x-semi-prop': 'children' }), n)
          );
        }
        return g;
      }),
      (this.renderBottomSlot = () => {
        var n, o;
        if (!this.props.bottomSlot) return null;
        if (this.props.bottomSlot.render) return this.props.bottomSlot.render();
        const a =
          (n = this.props.bottomSlot.render) !== null && n !== void 0
            ? n
            : () => {
                var l;
                const c = {};
                return (
                  this.props.bottomSlot.bgColor && (c.backgroundColor = this.props.bottomSlot.bgColor),
                  this.props.bottomSlot.textColor && (c.color = this.props.bottomSlot.textColor),
                  E.createElement(
                    'span',
                    {
                      style: c,
                      className: de(
                        `${He}-bottom_slot-shape_${this.props.bottomSlot.shape}`,
                        `${He}-bottom_slot-shape_${this.props.bottomSlot.shape}-${this.props.size}`,
                        (l = this.props.bottomSlot.className) !== null && l !== void 0 ? l : ''
                      ),
                    },
                    this.props.bottomSlot.text
                  )
                );
              };
        return E.createElement(
          'div',
          {
            className: de([`${He}-bottom_slot`]),
            style: (o = this.props.bottomSlot.style) !== null && o !== void 0 ? o : {},
          },
          a()
        );
      }),
      (this.renderTopSlot = () => {
        var n, o, a, l;
        if (!this.props.topSlot) return null;
        if (this.props.topSlot.render) return this.props.topSlot.render();
        const c = {};
        return (
          this.props.topSlot.textColor && (c.color = this.props.topSlot.textColor),
          E.createElement(
            'div',
            {
              style: (n = this.props.topSlot.style) !== null && n !== void 0 ? n : {},
              className: de([
                `${He}-top_slot-wrapper`,
                (o = this.props.topSlot.className) !== null && o !== void 0 ? o : '',
                { [`${He}-animated`]: this.props.contentMotion },
              ]),
            },
            E.createElement(
              'div',
              { className: de([`${He}-top_slot-bg`, `${He}-top_slot-bg-${this.props.size}`]) },
              E.createElement(
                'div',
                { className: de([`${He}-top_slot-bg-svg`, `${He}-top_slot-bg-svg-${this.props.size}`]) },
                E.createElement(gI, {
                  gradientStart:
                    (a = this.props.topSlot.gradientStart) !== null && a !== void 0 ? a : 'var(--semi-color-primary)',
                  gradientEnd:
                    (l = this.props.topSlot.gradientEnd) !== null && l !== void 0 ? l : 'var(--semi-color-primary)',
                })
              )
            ),
            E.createElement(
              'div',
              { className: de([`${He}-top_slot`]) },
              E.createElement(
                'div',
                { style: c, className: de([`${He}-top_slot-content`, `${He}-top_slot-content-${this.props.size}`]) },
                this.props.topSlot.text
              )
            )
          )
        );
      }),
      (this.state = { isImgExist: !0, hoverContent: '', focusVisible: !1, scale: 1 }),
      (this.onEnter = this.onEnter.bind(this)),
      (this.onLeave = this.onLeave.bind(this)),
      (this.handleError = this.handleError.bind(this)),
      (this.handleKeyDown = this.handleKeyDown.bind(this)),
      (this.getContent = this.getContent.bind(this)),
      (this.avatarRef = E.createRef());
  }
  get adapter() {
    return Object.assign(Object.assign({}, super.adapter), {
      notifyImgState: r => {
        this.setState({ isImgExist: r });
      },
      notifyEnter: r => {
        const { hoverMask: n } = this.props,
          o = n;
        this.setState({ hoverContent: o }, () => {
          const { onMouseEnter: a } = this.props;
          a && a(r);
        });
      },
      notifyLeave: r => {
        this.setState({ hoverContent: '' }, () => {
          const { onMouseLeave: n } = this.props;
          n && n(r);
        });
      },
      setFocusVisible: r => {
        this.setState({ focusVisible: r });
      },
      setScale: r => {
        this.setState({ scale: r });
      },
      getAvatarNode: () => {
        var r;
        return (r = this.avatarRef) === null || r === void 0 ? void 0 : r.current;
      },
    });
  }
  componentDidMount() {
    (this.foundation = new mI(this.adapter)), this.foundation.init();
  }
  componentDidUpdate(r) {
    if (this.props.src && this.props.src !== r.src) {
      const n = new Image(0, 0);
      (n.src = this.props.src),
        (n.onload = () => {
          this.setState({ isImgExist: !0 });
        }),
        (n.onerror = () => {
          this.setState({ isImgExist: !1 });
        }),
        (n.onabort = () => {
          this.setState({ isImgExist: !1 });
        });
    }
    typeof this.props.children == 'string' && this.props.children !== r.children && this.foundation.changeScale();
  }
  componentWillUnmount() {
    this.foundation.destroy();
  }
  onEnter(r) {
    this.foundation.handleEnter(r);
  }
  onLeave(r) {
    this.foundation.handleLeave(r);
  }
  handleError() {
    this.foundation.handleImgLoadError();
  }
  handleKeyDown(r) {
    const { onClick: n } = this.props;
    switch (r.key) {
      case 'Enter':
        n(r), ao(r);
        break;
      case 'Escape':
        r.target.blur();
        break;
    }
  }
  render() {
    var r;
    const n = this.props,
      {
        shape: o,
        children: a,
        size: l,
        color: c,
        className: d,
        hoverMask: h,
        onClick: g,
        imgAttr: y,
        src: w,
        srcSet: S,
        style: _,
        alt: x,
        gap: T,
        bottomSlot: O,
        topSlot: L,
        border: I,
        contentMotion: $,
      } = n,
      H = yI(n, [
        'shape',
        'children',
        'size',
        'color',
        'className',
        'hoverMask',
        'onClick',
        'imgAttr',
        'src',
        'srcSet',
        'style',
        'alt',
        'gap',
        'bottomSlot',
        'topSlot',
        'border',
        'contentMotion',
      ]),
      { isImgExist: V, hoverContent: F, focusVisible: b } = this.state;
    let q = {};
    vo.SIZE.includes(l) || (q = { width: l, height: l }), (q = Object.assign(Object.assign({}, q), _));
    const W = O || L || I,
      X = { onClick: g, onMouseEnter: this.onEnter, onMouseLeave: this.onLeave },
      G = w && V,
      oe = de(
        He,
        {
          [`${He}-${o}`]: o,
          [`${He}-${l}`]: l,
          [`${He}-${c}`]: c && !G,
          [`${He}-img`]: G,
          [`${He}-focus`]: b,
          [`${He}-animated`]: $,
        },
        d
      ),
      ie = F ? E.createElement('div', { className: `${He}-hover`, 'x-semi-prop': 'hoverContent' }, F) : null;
    let fe = E.createElement(
      'span',
      Object.assign({}, H, { style: W ? {} : q, className: oe }, W ? {} : X, { role: 'listitem', ref: this.avatarRef }),
      this.getContent(),
      ie
    );
    if (I) {
      const me = {};
      typeof I == 'object' && I?.color && (me.borderColor = I?.color),
        (fe = E.createElement(
          'div',
          { style: Object.assign({ position: 'relative' }, q) },
          fe,
          E.createElement('span', {
            style: me,
            className: de([`${He}-additionalBorder`, `${He}-additionalBorder-${l}`, { [`${He}-${o}`]: o }]),
          }),
          typeof this.props.border == 'object' &&
            this.props.border.motion &&
            E.createElement('span', {
              style: me,
              className: de([
                `${He}-additionalBorder`,
                `${He}-additionalBorder-${l}`,
                {
                  [`${He}-${o}`]: o,
                  [`${He}-additionalBorder-animated`]:
                    typeof this.props.border == 'object' &&
                    ((r = this.props.border) === null || r === void 0 ? void 0 : r.motion),
                },
              ]),
            })
        ));
    }
    return W
      ? E.createElement(
          'span',
          Object.assign({ className: de([`${He}-wrapper`]), style: q }, X),
          fe,
          L &&
            ['extra-small', 'small', 'default', 'medium', 'large', 'extra-large'].includes(l) &&
            o === 'circle' &&
            this.renderTopSlot(),
          O &&
            ['extra-small', 'small', 'default', 'medium', 'large', 'extra-large'].includes(l) &&
            this.renderBottomSlot()
        )
      : fe;
  }
};
co.__SemiComponentName__ = 'Avatar';
co.defaultProps = Pi(co.__SemiComponentName__, {
  size: 'medium',
  color: 'grey',
  shape: 'circle',
  gap: 3,
  onClick: _n,
  onMouseEnter: _n,
  onMouseLeave: _n,
});
co.propTypes = {
  children: m.node,
  color: m.oneOf(_I),
  shape: m.oneOf(wI),
  size: m.oneOf(vI),
  hoverMask: m.node,
  className: m.string,
  style: m.object,
  gap: m.number,
  imgAttr: m.object,
  src: m.string,
  srcSet: m.string,
  alt: m.string,
  onError: m.func,
  onClick: m.func,
  onMouseEnter: m.func,
  onMouseLeave: m.func,
  bottomSlot: m.shape({
    render: m.func,
    shape: m.oneOf(['circle', 'square']),
    text: m.node,
    bgColor: m.string,
    textColor: m.string,
    className: m.string,
    style: m.object,
  }),
  topSlot: m.shape({
    render: m.func,
    gradientStart: m.string,
    gradientEnd: m.string,
    text: m.node,
    textColor: m.string,
    className: m.string,
    style: m.object,
  }),
  border: m.oneOfType([m.shape({ color: m.string, motion: m.bool }), m.bool]),
  contentMotion: m.bool,
};
co.elementType = 'Avatar';
const E1 = { PREFIX: `${nr}-button` },
  La = {
    sizes: ['default', 'small', 'large'],
    iconPositions: ['left', 'right'],
    htmlTypes: ['button', 'reset', 'submit'],
    btnTypes: ['primary', 'secondary', 'tertiary', 'warning', 'danger'],
    themes: ['solid', 'borderless', 'light', 'outline'],
    DEFAULT_ICON_POSITION: 'left',
  },
  SI = { SIZE: ['extra-small', 'small', 'default', 'large', 'extra-large', 'custom'] };
var EI = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const bI = La.sizes,
  { htmlTypes: CI, btnTypes: OI } = La;
let ja = class extends A.PureComponent {
  render() {
    const r = this.props,
      {
        children: n,
        block: o,
        htmlType: a,
        loading: l,
        circle: c,
        className: d,
        style: h,
        disabled: g,
        size: y,
        theme: w,
        type: S,
        colorful: _,
        prefixCls: x,
        iconPosition: T,
      } = r,
      O = EI(r, [
        'children',
        'block',
        'htmlType',
        'loading',
        'circle',
        'className',
        'style',
        'disabled',
        'size',
        'theme',
        'type',
        'colorful',
        'prefixCls',
        'iconPosition',
      ]),
      L = Object.assign(Object.assign({ disabled: g }, yo(O, ['x-semi-children-alias'])), {
        className: de(
          x,
          {
            [`${x}-${S}`]: !g && S,
            [`${x}-disabled`]: g,
            [`${x}-size-large`]: y === 'large',
            [`${x}-size-small`]: y === 'small',
            [`${x}-block`]: o,
            [`${x}-circle`]: c,
            [`${x}-${w}`]: w,
            [`${x}-${S}-disabled`]: g && S,
            [`${x}-colorful`]: _,
          },
          d
        ),
        type: a,
        'aria-disabled': g,
      }),
      I = {};
    return (
      (d && d.includes('-with-icon')) || (I['x-semi-prop'] = this.props['x-semi-children-alias'] || 'children'),
      E.createElement(
        'button',
        Object.assign({}, L, { onClick: this.props.onClick, onMouseDown: this.props.onMouseDown, style: h }),
        E.createElement(
          'span',
          Object.assign(
            { className: de(`${x}-content`, this.props.contentClassName), onClick: $ => g && $.stopPropagation() },
            I
          ),
          n
        )
      )
    );
  }
};
ja.defaultProps = {
  disabled: !1,
  size: 'default',
  type: 'primary',
  theme: 'light',
  block: !1,
  htmlType: 'button',
  onMouseDown: _n,
  onClick: _n,
  onMouseEnter: _n,
  onMouseLeave: _n,
  colorful: !1,
  prefixCls: E1.PREFIX,
};
ja.propTypes = {
  children: m.node,
  disabled: m.bool,
  prefixCls: m.string,
  style: m.object,
  size: m.oneOf(bI),
  type: m.oneOf(OI),
  block: m.bool,
  onClick: m.func,
  onMouseDown: m.func,
  circle: m.bool,
  loading: m.bool,
  htmlType: m.oneOf(CI),
  theme: m.oneOf(La.themes),
  className: m.string,
  onMouseEnter: m.func,
  onMouseLeave: m.func,
  'aria-label': m.string,
  contentClassName: m.string,
};
var xI = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const PI = SI.SIZE;
class Da extends A.PureComponent {
  render() {
    const r = this.props,
      {
        children: n,
        iconPosition: o,
        iconSize: a,
        iconStyle: l,
        style: c,
        icon: d,
        noHorizontalPadding: h,
        theme: g,
        className: y,
        prefixCls: w,
        loading: S,
      } = r,
      _ = xI(r, [
        'children',
        'iconPosition',
        'iconSize',
        'iconStyle',
        'style',
        'icon',
        'noHorizontalPadding',
        'theme',
        'className',
        'prefixCls',
        'loading',
      ]),
      x = Object.assign({}, c),
      { colorful: T, type: O, disabled: L } = _;
    Array.isArray(h)
      ? (h.includes('left') && (x.paddingLeft = 0), h.includes('right') && (x.paddingRight = 0))
      : h === !0
      ? ((x.paddingLeft = 0), (x.paddingRight = 0))
      : typeof h == 'string' && (h === 'left' && (x.paddingLeft = 0), h === 'right' && (x.paddingRight = 0));
    let I = null,
      $ = null;
    if (S && !_.disabled)
      (T && ['light', 'outline', 'borderless'].includes(g)) || (g === 'solid' && O === 'tertiary')
        ? ($ = E.createElement(zR, { className: `${w}-content-loading-icon` }))
        : ($ = E.createElement(pI, null));
    else if (E.isValidElement(d))
      if (T) {
        const q = (g === 'solid' && O === 'tertiary') || (O === 'primary' && ['light', 'borderless'].includes(g)),
          W = O === 'tertiary' && ['light', 'borderless', 'outline'].includes(g);
        if (q) {
          let X;
          L
            ? (X = new Array(4).fill('var(--semi-color-disabled-text)'))
            : (X = [
                'var(--semi-button-colorful-multiple-fill-0)',
                'var(--semi-button-colorful-multiple-fill-1)',
                'var(--semi-button-colorful-multiple-fill-2)',
                'var(--semi-button-colorful-multiple-fill-3)',
              ]),
            ($ = E.cloneElement(d, { fill: X }));
        } else if (W) {
          let X;
          L
            ? (X = new Array(2).fill('var(--semi-color-disabled-text)'))
            : (X = ['var(--semi-button-colorful-fill-primary)', 'var(--semi-button-colorful-fill-secondary)']),
            ($ = E.cloneElement(d, { fill: X }));
        } else $ = d;
      } else $ = d;
    const H = de({ [`${w}-content-left`]: o === 'right', [`${w}-content-right`]: o === 'left' }),
      V = this.props['x-semi-children-alias'] || 'children',
      F = n != null ? E.createElement('span', { className: H, 'x-semi-prop': V }, n) : null;
    o === 'left' ? (I = E.createElement(E.Fragment, null, $, F)) : (I = E.createElement(E.Fragment, null, F, $));
    const b = de(y, `${w}-with-icon`, { [`${w}-with-icon-only`]: F == null || F === '', [`${w}-loading`]: S });
    return E.createElement(ja, Object.assign({}, _, { className: b, theme: g, style: x }), I);
  }
}
Da.defaultProps = {
  iconPosition: La.DEFAULT_ICON_POSITION,
  prefixCls: E1.PREFIX,
  loading: !1,
  noHorizontalPadding: !1,
  onMouseEnter: ze,
  onMouseLeave: ze,
};
Da.elementType = 'IconButton';
Da.propTypes = {
  iconStyle: m.object,
  style: m.object,
  loading: m.bool,
  prefixCls: m.string,
  icon: m.oneOfType([m.object, m.string, m.node]),
  iconSize: m.oneOf(PI),
  noHorizontalPadding: m.oneOfType([m.bool, m.string, m.array]),
  children: m.node,
  theme: m.string,
  iconPosition: m.oneOf(La.iconPositions),
  className: m.string,
  onMouseEnter: m.func,
  onMouseLeave: m.func,
};
let Ei = class extends E.PureComponent {
  constructor() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    super(r);
  }
  render() {
    const r = Object.assign({}, this.props),
      n = !!r.icon,
      o = !!r.loading,
      a = !!r.disabled;
    return n || (o && !a) ? E.createElement(Da, Object.assign({}, r)) : E.createElement(ja, Object.assign({}, r));
  }
};
Ei.__SemiComponentName__ = 'Button';
Ei.propTypes = Object.assign(Object.assign({}, ja.propTypes), Da.propTypes);
Ei.defaultProps = Pi(Ei.__SemiComponentName__);
Ei.elementType = 'Button';
const b1 = { PREFIX: `${nr}-card` },
  TI = { SHADOWS: ['hover', 'always'] };
var RI = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const la = b1.PREFIX;
let C1 = class extends A.PureComponent {
  render() {
    const r = this.props,
      { avatar: n, className: o, description: a, style: l, title: c } = r,
      d = RI(r, ['avatar', 'className', 'description', 'style', 'title']),
      h = de(`${la}-meta`, o),
      g = n && E.createElement('div', { className: `${la}-meta-avatar` }, n),
      y = c && E.createElement('div', { className: `${la}-meta-wrapper-title` }, c),
      w = a && E.createElement('div', { className: `${la}-meta-wrapper-description` }, a),
      S = c || a ? E.createElement('div', { className: `${la}-meta-wrapper` }, y, w) : null;
    return E.createElement('div', Object.assign({}, d, { className: h, style: l }), g, S);
  }
};
C1.propTypes = { avatar: m.node, className: m.string, description: m.node, style: m.object, title: m.node };
const Vh = { PREFIX: `${nr}-skeleton` };
var II = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const NI = vo.SIZE,
  kI = vo.SHAPE,
  bl = i => r => n => E.createElement(r, Object.assign({ type: i }, n));
class wo extends A.PureComponent {
  render() {
    const r = this.props,
      { prefixCls: n, className: o, type: a, size: l, shape: c } = r,
      d = II(r, ['prefixCls', 'className', 'type', 'size', 'shape']),
      h = de(
        o,
        `${n}-${a}`,
        { [`${n}-${a}-${l}`]: a.toUpperCase() === 'AVATAR' },
        { [`${n}-${a}-${c}`]: a.toUpperCase() === 'AVATAR' }
      );
    return E.createElement('div', Object.assign({ className: h }, d));
  }
}
wo.propTypes = {
  type: m.string,
  prefixCls: m.string,
  style: m.object,
  className: m.string,
  size: m.oneOf(NI),
  shape: m.oneOf(kI),
};
wo.defaultProps = { prefixCls: Vh.PREFIX, size: 'medium', shape: 'circle' };
const AI = bl('avatar')(wo),
  LI = bl('image')(wo),
  jI = bl('title')(wo),
  DI = bl('button')(wo);
class Wh extends A.PureComponent {
  render() {
    const { prefixCls: r, className: n, style: o, rows: a } = this.props,
      l = de(n, `${r}-paragraph`);
    return E.createElement(
      'ul',
      { className: l, style: o },
      [...Array(a)].map((c, d) => E.createElement('li', { key: d }))
    );
  }
}
Wh.propTypes = { rows: m.number, prefixCls: m.string, style: m.object, className: m.string };
Wh.defaultProps = { prefixCls: Vh.PREFIX, rows: 4 };
var MI = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const F_ = Vh.PREFIX;
class tn extends A.PureComponent {
  render() {
    const r = this.props,
      { placeholder: n, active: o, children: a, className: l, loading: c, style: d } = r,
      h = MI(r, ['placeholder', 'active', 'children', 'className', 'loading', 'style']),
      g = de(F_, { [`${F_}-active`]: !!o }, l);
    let y;
    return (
      c
        ? (y = E.createElement(
            'div',
            Object.assign({ className: g, style: d }, h, { 'x-semi-prop': 'placeholder' }),
            n
          ))
        : (y = a),
      y
    );
  }
}
tn.Avatar = AI;
tn.Title = jI;
tn.Button = DI;
tn.Paragraph = Wh;
tn.Image = LI;
tn.defaultProps = { loading: !0 };
tn.propTypes = {
  active: m.bool,
  placeholder: m.node,
  style: m.object,
  className: m.string,
  loading: m.bool,
  children: m.node,
};
const FI = { PREFIX: `${nr}-space` },
  _i = {
    ALIGN_SET: ['start', 'end', 'center', 'baseline'],
    SPACING_LOOSE: 'loose',
    SPACING_MEDIUM: 'medium',
    SPACING_TIGHT: 'tight',
  },
  $I = 'Symbol(react.fragment)',
  lh = i => {
    let r = [];
    return (
      E.Children.forEach(i, n => {
        n != null &&
          (Array.isArray(n)
            ? (r = r.concat(lh(n)))
            : A.isValidElement(n) && n.type && n.type.toString() === $I && n.props
            ? (r = r.concat(lh(n.props.children)))
            : r.push(n));
      }),
      r
    );
  },
  Fr = FI.PREFIX;
class Gh extends A.PureComponent {
  render() {
    const { children: r = null, style: n, className: o, spacing: a, wrap: l, align: c, vertical: d } = this.props,
      h = l && d ? !1 : l,
      g = Object.assign({}, n);
    let y = '',
      w = '';
    ga(a)
      ? ((y = a), (w = a))
      : Kp(a)
      ? ((g.rowGap = a), (g.columnGap = a))
      : Lx(a) &&
        (ga(a[0]) ? (y = a[0]) : Kp(a[0]) && (g.columnGap = `${a[0]}px`),
        ga(a[1]) ? (w = a[1]) : Kp(a[1]) && (g.rowGap = `${a[1]}px`));
    const S = de(Fr, o, {
        [`${Fr}-align-${c}`]: c,
        [`${Fr}-vertical`]: d,
        [`${Fr}-horizontal`]: !d,
        [`${Fr}-wrap`]: h,
        [`${Fr}-tight-horizontal`]: y === _i.SPACING_TIGHT,
        [`${Fr}-tight-vertical`]: w === _i.SPACING_TIGHT,
        [`${Fr}-medium-horizontal`]: y === _i.SPACING_MEDIUM,
        [`${Fr}-medium-vertical`]: w === _i.SPACING_MEDIUM,
        [`${Fr}-loose-horizontal`]: y === _i.SPACING_LOOSE,
        [`${Fr}-loose-vertical`]: w === _i.SPACING_LOOSE,
      }),
      _ = lh(r),
      x = qS(this.props);
    return E.createElement('div', Object.assign({}, x, { className: S, style: g, 'x-semi-prop': 'children' }), _);
  }
}
Gh.propTypes = {
  wrap: m.bool,
  align: m.oneOf(_i.ALIGN_SET),
  vertical: m.bool,
  spacing: m.oneOfType([m.string, m.number, m.array]),
  children: m.node,
  style: m.object,
  className: m.string,
};
Gh.defaultProps = { vertical: !1, wrap: !1, spacing: 'tight', align: 'center' };
var zI = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const $t = b1.PREFIX;
class Ma extends A.PureComponent {
  constructor() {
    super(...arguments),
      (this.renderHeader = () => {
        const { title: r, headerExtraContent: n, header: o, headerLine: a, headerStyle: l } = this.props,
          c = de(`${$t}-header`, { [`${$t}-header-bordered`]: !!a }),
          d = de(`${$t}-header-wrapper`),
          h = de(`${$t}-header-wrapper-title`, { [`${$t}-header-wrapper-spacing`]: !!n });
        return o || n || r
          ? E.createElement(
              'div',
              { style: l, className: c },
              o ||
                E.createElement(
                  'div',
                  { className: d },
                  n &&
                    E.createElement(
                      'div',
                      { className: `${$t}-header-wrapper-extra`, 'x-semi-prop': 'headerExtraContent' },
                      n
                    ),
                  r &&
                    E.createElement(
                      'div',
                      { className: h },
                      ga(r)
                        ? E.createElement(
                            Aa.Title,
                            { heading: 6, ellipsis: { showTooltip: !0, rows: 1 }, 'x-semi-prop': 'title' },
                            r
                          )
                        : r
                    )
                )
            )
          : null;
      }),
      (this.renderCover = () => {
        const { cover: r } = this.props,
          n = de(`${$t}-cover`);
        return r && E.createElement('div', { className: n, 'x-semi-prop': 'cover' }, r);
      }),
      (this.renderBody = () => {
        const { bodyStyle: r, children: n, actions: o, loading: a } = this.props,
          l = de(`${$t}-body`),
          c = de(`${$t}-body-actions`),
          d = de(`${$t}-body-actions-item`),
          h = E.createElement(
            'div',
            null,
            E.createElement(tn.Title, null),
            E.createElement('br', null),
            E.createElement(tn.Paragraph, { rows: 3 })
          );
        return E.createElement(
          'div',
          { style: r, className: l },
          n && E.createElement(tn, { placeholder: h, loading: a, active: !0 }, n),
          Array.isArray(o) &&
            E.createElement(
              'div',
              { className: c },
              E.createElement(
                Gh,
                { spacing: 12 },
                o.map((g, y) => E.createElement('div', { key: y, className: d, 'x-semi-prop': `actions.${y}` }, g))
              )
            )
        );
      }),
      (this.renderFooter = () => {
        const { footer: r, footerLine: n, footerStyle: o } = this.props,
          a = de(`${$t}-footer`, { [`${$t}-footer-bordered`]: n });
        return r && E.createElement('div', { style: o, className: a, 'x-semi-prop': 'footer' }, r);
      });
  }
  render() {
    const r = this.props,
      { bordered: n, shadows: o, style: a, className: l } = r,
      c = zI(r, ['bordered', 'shadows', 'style', 'className']),
      d = yo(c, [
        'actions',
        'bodyStyle',
        'cover',
        'headerExtraContent',
        'footer',
        'footerLine',
        'footerStyle',
        'header',
        'headerLine',
        'headerStyle',
        'loading',
        'title',
      ]),
      h = de($t, l, { [`${$t}-bordered`]: n, [`${$t}-shadows`]: o, [`${$t}-shadows-${o}`]: o });
    return E.createElement(
      'div',
      Object.assign({}, d, { 'aria-busy': this.props.loading, className: h, style: a }),
      this.renderHeader(),
      this.renderCover(),
      this.renderBody(),
      this.renderFooter()
    );
  }
}
Ma.Meta = C1;
Ma.propTypes = {
  actions: m.array,
  bodyStyle: m.object,
  bordered: m.bool,
  children: m.node,
  className: m.string,
  cover: m.node,
  footer: m.node,
  footerLine: m.bool,
  footerStyle: m.object,
  header: m.node,
  headerExtraContent: m.node,
  headerLine: m.bool,
  headerStyle: m.object,
  loading: m.bool,
  shadows: m.oneOf(TI.SHADOWS),
  style: m.object,
  title: m.node,
  'aria-label': m.string,
};
Ma.defaultProps = { bordered: !0, footerLine: !1, headerLine: !0, loading: !1 };
var Vp, $_;
function qI() {
  if ($_) return Vp;
  $_ = 1;
  var i = BS(),
    r = 1 / 0,
    n = 17976931348623157e292;
  function o(a) {
    if (!a) return a === 0 ? a : 0;
    if (((a = i(a)), a === r || a === -r)) {
      var l = a < 0 ? -1 : 1;
      return l * n;
    }
    return a === a ? a : 0;
  }
  return (Vp = o), Vp;
}
var Wp, z_;
function BI() {
  if (z_) return Wp;
  z_ = 1;
  var i = qI();
  function r(n) {
    var o = i(n),
      a = o % 1;
    return o === o ? (a ? o - a : o) : 0;
  }
  return (Wp = r), Wp;
}
var Gp, q_;
function UI() {
  if (q_) return Gp;
  q_ = 1;
  var i = Ch(),
    r = g1(),
    n = ho();
  function o(a, l, c) {
    for (var d = -1, h = l.length, g = {}; ++d < h; ) {
      var y = l[d],
        w = i(a, y);
      c(w, y) && r(g, n(y, a), w);
    }
    return g;
  }
  return (Gp = o), Gp;
}
var Xp, B_;
function HI() {
  if (B_) return Xp;
  B_ = 1;
  function i(r, n) {
    return r != null && n in Object(r);
  }
  return (Xp = i), Xp;
}
var Yp, U_;
function KI() {
  if (U_) return Yp;
  U_ = 1;
  var i = ho(),
    r = Ta(),
    n = ir(),
    o = hl(),
    a = Th(),
    l = pl();
  function c(d, h, g) {
    h = i(h, d);
    for (var y = -1, w = h.length, S = !1; ++y < w; ) {
      var _ = l(h[y]);
      if (!(S = d != null && g(d, _))) break;
      d = d[_];
    }
    return S || ++y != w ? S : ((w = d == null ? 0 : d.length), !!w && a(w) && o(_, w) && (n(d) || r(d)));
  }
  return (Yp = c), Yp;
}
var Qp, H_;
function VI() {
  if (H_) return Qp;
  H_ = 1;
  var i = HI(),
    r = KI();
  function n(o, a) {
    return o != null && r(o, a, i);
  }
  return (Qp = n), Qp;
}
var Zp, K_;
function WI() {
  if (K_) return Zp;
  K_ = 1;
  var i = UI(),
    r = VI();
  function n(o, a) {
    return i(o, a, function (l, c) {
      return r(o, c);
    });
  }
  return (Zp = n), Zp;
}
var Jp, V_;
function GI() {
  if (V_) return Jp;
  V_ = 1;
  var i = WI(),
    r = u1(),
    n = r(function (o, a) {
      return o == null ? {} : i(o, a);
    });
  return (Jp = n), Jp;
}
var XI = GI();
const W_ = ut(XI);
class YI extends nn {
  constructor(r) {
    super(Object.assign({}, r)),
      (this.updateDOMInRenderTree = n => {
        this._adapter.setDOMInRenderTree(n);
      }),
      (this.updateDOMHeight = n => {
        this._adapter.setDOMHeight(n);
      }),
      (this.updateVisible = n => {
        this._adapter.setVisible(n);
      }),
      (this.updateIsTransitioning = n => {
        this._adapter.setIsTransitioning(n);
      });
  }
}
const G_ = { PREFIX: `${nr}-collapsible` };
class bi extends Rr {
  constructor(r) {
    super(r),
      (this.domRef = E.createRef()),
      (this.hasBeenRendered = !1),
      (this.handleResize = n => {
        const o = n[0];
        if (o) {
          const a = bi.getEntryInfo(o);
          this.foundation.updateDOMHeight(a.height), this.foundation.updateDOMInRenderTree(a.isShown);
        }
      }),
      (this.isChildrenInRenderTree = () => (this.domRef.current ? this.domRef.current.offsetHeight > 0 : !1)),
      (this.state = {
        domInRenderTree: !1,
        domHeight: 0,
        visible: this.props.isOpen,
        isTransitioning: !1,
        cacheIsOpen: this.props.isOpen,
      }),
      (this.foundation = new YI(this.adapter));
  }
  get adapter() {
    return Object.assign(Object.assign({}, super.adapter), {
      setDOMInRenderTree: r => {
        this.state.domInRenderTree !== r && this.setState({ domInRenderTree: r });
      },
      setDOMHeight: r => {
        this.state.domHeight !== r && this.setState({ domHeight: r });
      },
      setVisible: r => {
        this.state.visible !== r && this.setState({ visible: r });
      },
      setIsTransitioning: r => {
        this.state.isTransitioning !== r && this.setState({ isTransitioning: r });
      },
    });
  }
  componentDidMount() {
    super.componentDidMount(),
      (this.resizeObserver = new ResizeObserver(this.handleResize)),
      this.resizeObserver.observe(this.domRef.current);
    const r = this.isChildrenInRenderTree();
    this.foundation.updateDOMInRenderTree(r), r && this.foundation.updateDOMHeight(this.domRef.current.scrollHeight);
  }
  static getDerivedStateFromProps(r, n) {
    const o = {},
      a = r.isOpen !== n.cacheIsOpen;
    return (
      a && (r.isOpen || !r.motion) && (o.visible = r.isOpen),
      r.motion && a && (o.isTransitioning = !0),
      (o.cacheIsOpen = r.isOpen),
      o
    );
  }
  componentDidUpdate(r, n, o) {
    const a = Object.keys(W_(this.props, ['reCalcKey'])).filter(c => !oo(this.props[c], r[c])),
      l = Object.keys(W_(this.state, ['domInRenderTree'])).filter(c => !oo(this.state[c], n[c]));
    a.includes('reCalcKey') && this.foundation.updateDOMHeight(this.domRef.current.scrollHeight),
      l.includes('domInRenderTree') &&
        this.state.domInRenderTree &&
        this.foundation.updateDOMHeight(this.domRef.current.scrollHeight);
  }
  componentWillUnmount() {
    super.componentWillUnmount(), this.resizeObserver.disconnect();
  }
  render() {
    const r = Object.assign(
        {
          overflow: 'hidden',
          height: this.props.isOpen ? this.state.domHeight : this.props.collapseHeight,
          opacity: this.props.isOpen || !this.props.fade || this.props.collapseHeight !== 0 ? 1 : 0,
          transitionDuration: `${this.props.motion && this.state.isTransitioning ? this.props.duration : 0}ms`,
        },
        this.props.style
      ),
      n = de(
        `${G_.PREFIX}-wrapper`,
        { [`${G_.PREFIX}-transition`]: this.props.motion && this.state.isTransitioning },
        this.props.className
      ),
      o =
        (this.props.keepDOM && (this.props.lazyRender ? this.hasBeenRendered : !0)) ||
        this.props.collapseHeight !== 0 ||
        this.state.visible ||
        this.props.isOpen;
    return (
      o && !this.hasBeenRendered && (this.hasBeenRendered = !0),
      E.createElement(
        'div',
        Object.assign(
          {
            className: n,
            style: r,
            onTransitionEnd: () => {
              var a, l;
              this.props.isOpen || this.foundation.updateVisible(!1),
                this.foundation.updateIsTransitioning(!1),
                (l = (a = this.props).onMotionEnd) === null || l === void 0 || l.call(a);
            },
          },
          this.getDataAttr(this.props)
        ),
        E.createElement(
          'div',
          { 'x-semi-prop': 'children', ref: this.domRef, style: { overflow: 'hidden' }, id: this.props.id },
          o && this.props.children
        )
      )
    );
  }
}
bi.__SemiComponentName__ = 'Collapsible';
bi.defaultProps = Pi(bi.__SemiComponentName__, {
  isOpen: !1,
  duration: 250,
  motion: !0,
  keepDOM: !1,
  lazyRender: !1,
  collapseHeight: 0,
  fade: !1,
});
bi.getEntryInfo = i => {
  let r;
  i.borderBoxSize
    ? (r = !(i.borderBoxSize[0].blockSize === 0 && i.borderBoxSize[0].inlineSize === 0))
    : (r = !(i.contentRect.height === 0 && i.contentRect.width === 0));
  let n = 0;
  return (
    i.borderBoxSize ? (n = Math.ceil(i.borderBoxSize[0].blockSize)) : (n = i.target.clientHeight),
    { isShown: r, height: n }
  );
};
var eh, X_;
function QI() {
  if (X_) return eh;
  X_ = 1;
  var i = KS(),
    r = h1(),
    n = BI(),
    o = 9007199254740991,
    a = 4294967295,
    l = Math.min;
  function c(d, h) {
    if (((d = n(d)), d < 1 || d > o)) return [];
    var g = a,
      y = l(d, a);
    (h = r(h)), (d -= a);
    for (var w = i(y, h); ++g < d; ) h(g);
    return w;
  }
  return (eh = c), eh;
}
var ZI = QI();
const O1 = ut(ZI),
  Fa = { PREFIX: `${nr}-dropdown` },
  Cl = {
    POSITION_SET: io.POSITION_SET,
    TRIGGER_SET: ['hover', 'focus', 'click', 'custom', 'contextMenu'],
    DEFAULT_LEAVE_DELAY: 100,
    ITEM_TYPE: ['primary', 'secondary', 'tertiary', 'warning', 'danger'],
  },
  Y_ = { SPACING: 4, NESTED_SPACING: 2 };
class JI extends nn {
  handleVisibleChange(r) {
    this._adapter.setPopVisible(r), this._adapter.notifyVisibleChange(r);
    const { trigger: n } = this.getProps();
    if (r && n === 'click') {
      const o = this._adapter.getPopupId();
      this.setFocusToFirstMenuItem(o);
    }
  }
  getMenuItemNodes(r) {
    const n = document.getElementById(r);
    return n ? Array.from(n.getElementsByTagName('li')).filter(o => o.ariaDisabled === 'false') : null;
  }
  setFocusToFirstMenuItem(r) {
    const n = this.getMenuItemNodes(r);
    n && yT(n);
  }
  setFocusToLastMenuItem(r) {
    const n = this.getMenuItemNodes(r);
    n && vT(n);
  }
  handleKeyDown(r) {
    var n, o;
    const a =
        (o = (n = r.target) === null || n === void 0 ? void 0 : n.attributes['data-popupid']) === null || o === void 0
          ? void 0
          : o.value,
      { visible: l } = this._adapter.getStates();
    switch (r.key) {
      case ' ':
      case 'Enter':
        r.target.click();
        break;
      case 'ArrowDown':
        this.setFocusToFirstMenuItem(a), l && ao(r);
        break;
      case 'ArrowUp':
        this.setFocusToLastMenuItem(a), l && ao(r);
        break;
    }
  }
}
class eN extends nn {
  constructor() {
    super(...arguments), (this.menuItemNodes = null), (this.firstChars = []);
  }
  handleEscape(r) {
    this._adapter.getContext('trigger') === 'custom' &&
      (r && bT(document.querySelectorAll('[data-popupid]'), r.id)).focus();
  }
  setFocusByFirstCharacter(r, n) {
    const o = ST(this.menuItemNodes, r, this.firstChars, n);
    o >= 0 && ka(this.menuItemNodes, this.menuItemNodes[o]);
  }
  onMenuKeydown(r) {
    const n = ET(r.target, 'tooltip');
    this.menuItemNodes ||
      (this.menuItemNodes = [...r.target.parentNode.getElementsByTagName('li')].filter(a => a.ariaDisabled !== 'true')),
      this.firstChars.length === 0 &&
        this.menuItemNodes.forEach(a => {
          var l;
          this.firstChars.push((l = a.textContent.trim()[0]) === null || l === void 0 ? void 0 : l.toLowerCase());
        });
    const o = this.menuItemNodes.find(a => a.tabIndex === 0);
    switch (r.key) {
      case ' ':
      case 'Enter':
        r.target.click();
        break;
      case 'Escape':
        this.handleEscape(n);
        break;
      case 'ArrowUp':
        wT(this.menuItemNodes, o), ao(r);
        break;
      case 'ArrowDown':
        _T(this.menuItemNodes, o), ao(r);
        break;
      default:
        gT(r.key) && this.setFocusByFirstCharacter(o, r.key);
        break;
    }
  }
}
const fo = E.createContext({ level: 0 });
var tN = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const rN = Fa.PREFIX;
class Xh extends Rr {
  constructor(r) {
    super(r), (this.foundation = new eN(this.adapter));
  }
  get adapter() {
    return Object.assign({}, super.adapter);
  }
  render() {
    const r = this.props,
      { children: n, className: o, style: a } = r,
      l = tN(r, ['children', 'className', 'style']);
    return E.createElement(
      'ul',
      Object.assign({ role: 'menu', 'aria-orientation': 'vertical' }, l, {
        className: de(`${rN}-menu`, o),
        style: a,
        onKeyDown: c => this.foundation.onMenuKeydown(c),
      }),
      n
    );
  }
}
Xh.propTypes = { children: m.node, className: m.string, style: m.object };
Xh.contextType = fo;
const wi = Fa.PREFIX;
class $a extends Rr {
  render() {
    const {
        children: r,
        disabled: n,
        className: o,
        forwardRef: a,
        style: l,
        type: c,
        active: d,
        icon: h,
        onKeyDown: g,
        showTick: y,
        hover: w,
      } = this.props,
      { showTick: S } = this.context,
      _ = S ?? y,
      x = de(o, {
        [`${wi}-item`]: !0,
        [`${wi}-item-disabled`]: n,
        [`${wi}-item-hover`]: w,
        [`${wi}-item-withTick`]: _,
        [`${wi}-item-${c}`]: c,
        [`${wi}-item-active`]: d,
      }),
      T = {};
    n ||
      ['onClick', 'onMouseEnter', 'onMouseLeave', 'onContextMenu'].forEach(I => {
        this.context.level !== 1 && I === 'onClick'
          ? (T.onMouseDown = H => {
              var V, F;
              H.button === 0 && ((F = (V = this.props)[I]) === null || F === void 0 || F.call(V, H));
            })
          : (T[I] = this.props[I]);
      });
    let O = null;
    switch (!0) {
      case _ && d:
        O = E.createElement(sh, null);
        break;
      case _ && !d:
        O = E.createElement(sh, { style: { color: 'transparent' } });
        break;
      default:
        O = null;
        break;
    }
    let L = null;
    return (
      h && (L = E.createElement('div', { className: `${wi}-item-icon` }, h)),
      E.createElement(
        'li',
        Object.assign(
          { role: 'menuitem', tabIndex: -1, 'aria-disabled': n },
          T,
          { onKeyDown: g, ref: I => a(I), className: x, style: l },
          this.getDataAttr(this.props)
        ),
        O,
        L,
        r
      )
    );
  }
}
$a.propTypes = {
  children: m.oneOfType([m.string, m.node]),
  name: m.string,
  disabled: m.bool,
  selected: m.bool,
  onClick: m.func,
  onMouseEnter: m.func,
  onMouseLeave: m.func,
  onContextMenu: m.func,
  className: m.string,
  style: m.object,
  forwardRef: m.func,
  type: m.oneOf(Cl.ITEM_TYPE),
  active: m.bool,
  icon: m.node,
};
$a.contextType = fo;
$a.defaultProps = { disabled: !1, divided: !1, selected: !1, onMouseEnter: ze, onMouseLeave: ze, forwardRef: ze };
$a.elementType = 'Dropdown.Item';
const nN = Fa.PREFIX,
  iN = function () {
    let i = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const { style: r, className: n } = i;
    return E.createElement('div', { className: de(`${nN}-divider`, n), style: r });
  },
  Q_ = Fa.PREFIX;
class Yh extends A.PureComponent {
  render() {
    const { className: r, style: n, children: o } = this.props,
      { showTick: a } = this.context,
      l = de({ [`${Q_}-title`]: !0, [`${Q_}-title-withTick`]: a }, r);
    return E.createElement('div', { className: l, style: n }, o);
  }
}
Yh.propTypes = { children: m.node, className: m.string, style: m.object };
Yh.contextType = fo;
var th = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
const oN = Cl.POSITION_SET,
  aN = Cl.TRIGGER_SET;
class Lt extends Rr {
  constructor(r) {
    super(r),
      (this.handleVisibleChange = n => this.foundation.handleVisibleChange(n)),
      (this.state = { popVisible: r.visible }),
      (this.foundation = new JI(this.adapter)),
      (this.tooltipRef = E.createRef());
  }
  get adapter() {
    return Object.assign(Object.assign({}, super.adapter), {
      setPopVisible: r => this.setState({ popVisible: r }),
      notifyVisibleChange: r => {
        var n, o;
        return (o = (n = this.props).onVisibleChange) === null || o === void 0 ? void 0 : o.call(n, r);
      },
      getPopupId: () => this.tooltipRef.current.getPopupId(),
    });
  }
  renderContent() {
    const { render: r, menu: n, contentClassName: o, style: a, showTick: l, prefixCls: c, trigger: d } = this.props,
      h = de(c, o),
      { level: g = 0 } = this.context,
      y = { showTick: l, level: g + 1, trigger: d };
    let w = null;
    return (
      E.isValidElement(r) ? (w = r) : Array.isArray(n) && (w = this.renderMenu()),
      E.createElement(
        fo.Provider,
        { value: y },
        E.createElement(
          'div',
          { className: h, style: a },
          E.createElement('div', { className: `${c}-content`, 'x-semi-prop': 'render' }, w)
        )
      )
    );
  }
  renderMenu() {
    const { menu: r } = this.props,
      n = r.map((o, a) => {
        switch (o.node) {
          case 'title': {
            const { name: l, node: c } = o,
              d = th(o, ['name', 'node']);
            return E.createElement(Lt.Title, Object.assign({}, d, { key: c + l + a }), l);
          }
          case 'item': {
            const { node: l, name: c } = o,
              d = th(o, ['node', 'name']);
            return E.createElement(Lt.Item, Object.assign({}, d, { key: l + c + a }), c);
          }
          case 'divider':
            return E.createElement(Lt.Divider, { key: o.node + a });
          default:
            return null;
        }
      });
    return E.createElement(Lt.Menu, null, n);
  }
  renderPopCard() {
    const { render: r, contentClassName: n, style: o, showTick: a, prefixCls: l } = this.props,
      c = de(l, n),
      { level: d = 0 } = this.context,
      h = { showTick: a, level: d + 1 };
    return E.createElement(
      fo.Provider,
      { value: h },
      E.createElement('div', { className: c, style: o }, E.createElement('div', { className: `${l}-content` }, r))
    );
  }
  render() {
    const r = this.props,
      {
        children: n,
        position: o,
        trigger: a,
        onVisibleChange: l,
        zIndex: c,
        className: d,
        motion: h,
        margin: g,
        style: y,
        prefixCls: w,
      } = r,
      S = th(r, [
        'children',
        'position',
        'trigger',
        'onVisibleChange',
        'zIndex',
        'className',
        'motion',
        'margin',
        'style',
        'prefixCls',
      ]);
    let { spacing: _ } = this.props;
    const { level: x } = this.context,
      { popVisible: T } = this.state,
      O = this.renderContent();
    return (
      x > 0 ? (_ = typeof _ == 'number' ? _ : Y_.NESTED_SPACING) : (_ === null || typeof _ > 'u') && (_ = Y_.SPACING),
      E.createElement(
        zr,
        Object.assign(
          {
            zIndex: c,
            motion: h,
            margin: g,
            content: O,
            className: d,
            prefixCls: w,
            spacing: _,
            position: o,
            trigger: a,
            onVisibleChange: this.handleVisibleChange,
            showArrow: !1,
            returnFocusOnClose: !0,
            ref: this.tooltipRef,
          },
          S
        ),
        E.isValidElement(n)
          ? E.cloneElement(n, {
              className: de(De(n, 'props.className'), { [`${w}-showing`]: T }),
              'aria-haspopup': !0,
              'aria-expanded': T,
              onKeyDown: L => {
                this.foundation.handleKeyDown(L);
                const I = De(n, 'props.onKeyDown');
                I && I(L);
              },
            })
          : n
      )
    );
  }
}
Lt.Menu = Xh;
Lt.Item = $a;
Lt.Divider = iN;
Lt.Title = Yh;
Lt.contextType = fo;
Lt.propTypes = {
  children: m.node,
  contentClassName: m.oneOfType([m.string, m.array]),
  className: m.string,
  getPopupContainer: m.func,
  margin: m.oneOfType([m.number, m.object]),
  mouseEnterDelay: m.number,
  mouseLeaveDelay: m.number,
  menu: m.array,
  motion: m.oneOfType([m.bool, m.func, m.object]),
  onVisibleChange: m.func,
  prefixCls: m.string,
  position: m.oneOf(oN),
  rePosKey: m.oneOfType([m.string, m.number]),
  render: m.node,
  spacing: m.oneOfType([m.number, m.object]),
  showTick: m.bool,
  style: m.object,
  trigger: m.oneOf(aN),
  visible: m.bool,
  zIndex: m.number,
};
Lt.__SemiComponentName__ = 'Dropdown';
Lt.defaultProps = Pi(Lt.__SemiComponentName__, {
  onVisibleChange: ze,
  prefixCls: Fa.PREFIX,
  zIndex: Wn.DEFAULT_Z_INDEX,
  motion: !0,
  trigger: 'hover',
  position: 'bottom',
  mouseLeaveDelay: Cl.DEFAULT_LEAVE_DELAY,
  showTick: !1,
  closeOnEsc: !0,
  onEscKeyDown: ze,
});
const Z_ = 'horizontal',
  J_ = 'vertical',
  $r = { PREFIX: `${nr}-navigation` },
  Ge = {
    MODE: [J_, Z_],
    MODE_VERTICAL: J_,
    MODE_HORIZONTAL: Z_,
    ICON_POS_LEFT: 'left',
    ICON_POS_RIGHT: 'right',
    TOGGLE_ICON_LEFT: 'left',
    TOGGLE_ICON_RIGHT: 'right',
  },
  to = {
    DEFAULT_SUBNAV_MAX_HEIGHT: 999,
    DEFAULT_TOOLTIP_SHOW_DELAY: 0,
    DEFAULT_TOOLTIP_HIDE_DELAY: 100,
    DEFAULT_SUBNAV_OPEN_DELAY: 0,
    DEFAULT_SUBNAV_CLOSE_DELAY: 100,
  },
  eS = { open: 'chevron_up', closed: 'chevron_down' };
let sN = class uh {
  constructor() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    (r == null || typeof r != 'object') &&
      (r = {
        text: r,
        itemKey: r,
        maxHeight: to.DEFAULT_SUBNAV_MAX_HEIGHT,
        link: null,
        items: null,
        icon: '',
        indent: !1,
      });
    for (const n of Object.keys(r)) this[n] = r[n];
    r.items && Array.isArray(r.items) && r.items.length
      ? ((this.items = r.items.map(n => new uh(n))),
        'toggleIcon' in r
          ? (this.toggleIcon = uh.isValidToggleIcon(r.toggleIcon)
              ? Object.assign({}, r.toggleIcon)
              : Object.assign({}, eS))
          : (this.toggleIcon = Object.assign({}, eS)))
      : (this.items = null);
  }
  static isValidToggleIcon(r) {
    return !!(
      r &&
      typeof r == 'object' &&
      typeof r.open == 'string' &&
      r.open.length &&
      typeof r.closed == 'string' &&
      r.closed.length
    );
  }
};
class ro extends nn {
  constructor(r) {
    super(Object.assign({}, r));
  }
  static getZeroParentKeys() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const n = [];
    for (var o = arguments.length, a = new Array(o > 1 ? o - 1 : 0), l = 1; l < o; l++) a[l - 1] = arguments[l];
    if (a.length) {
      for (const c of a)
        if (Array.isArray(r[c]) && r[c].length) {
          const d = r[c][0];
          en(d) || n.push(d);
        }
    }
    return n;
  }
  static buildItemKeysMap() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [],
      n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
      o = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [],
      a = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 'itemKey';
    var l;
    if (Array.isArray(r) && r.length)
      for (const c of r)
        if (Array.isArray(c)) ro.buildItemKeysMap(c, n, [...o], a);
        else {
          let d;
          if ((c && typeof c == 'object' && (d = c[a] || (c.props && c.props[a])), d)) {
            n[d] = [...o];
            const h = (l = c.props) === null || l === void 0 ? void 0 : l.children;
            if (Array.isArray(c.items) && c.items.length) ro.buildItemKeysMap(c.items, n, [...o, d], a);
            else if (h) {
              const g = Array.isArray(h) ? h : [h];
              ro.buildItemKeysMap(g, n, [...o, d], a);
            }
          }
        }
    return n;
  }
  init(r) {
    const { defaultSelectedKeys: n, selectedKeys: o } = this.getProps();
    let a = o || n || [];
    const { itemKeysMap: l, willOpenKeys: c, formattedItems: d } = this.getCalcState(),
      h = this.selectLevelZeroParentKeys(l, a);
    if (((a = a.concat(h)), r === 'constructor')) return { selectedKeys: a, itemKeysMap: l, openKeys: c, items: d };
    this._adapter.updateSelectedKeys(a, !1),
      this._adapter.setItemKeysMap(l),
      this._adapter.updateOpenKeys(c),
      this._adapter.updateItems(d),
      this._adapter.setItemsChanged(!0);
  }
  getCalcState() {
    const { itemKeysMap: r, formattedItems: n } = this.getFormattedItems(),
      o = this.getWillOpenKeys(r);
    return { itemKeysMap: r, willOpenKeys: o, formattedItems: n };
  }
  getFormattedItems() {
    const { items: r, children: n } = this.getProps(),
      o = this.formatItems(r),
      a = Array.isArray(r) && r.length ? o : n;
    return { itemKeysMap: ro.buildItemKeysMap(a), formattedItems: o };
  }
  getWillOpenKeys(r) {
    const { defaultOpenKeys: n, openKeys: o, defaultSelectedKeys: a, selectedKeys: l, mode: c } = this.getProps(),
      { openKeys: d = [] } = this.getStates();
    let h = o || n || [];
    if (!(Array.isArray(n) || Array.isArray(o)) && c === Ge.MODE_VERTICAL && (Array.isArray(a) || Array.isArray(l))) {
      const g = Array.isArray(l) ? l : a;
      (h = d.concat(this.getShouldOpenKeys(r, g))), (h = Array.from(new Set(h)));
    }
    return [...h];
  }
  getShouldOpenKeys() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
      n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
    const o = new Set();
    return (
      Array.isArray(n) &&
        n.length &&
        n.forEach(a => {
          if (a) {
            const l = De(r, a);
            Array.isArray(l) && l.forEach(c => o.add(c));
          }
        }),
      [...o]
    );
  }
  destroy() {}
  selectLevelZeroParentKeys(r, n) {
    const o = en(r) ? this.getState('itemKeysMap') : r,
      a = [];
    if (n.length) {
      for (const l of n)
        if (Array.isArray(o[l]) && o[l].length) {
          const c = o[l][0];
          en(c) || a.push(c);
        }
    }
    return a.length ? a : [];
  }
  formatItems() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
    const n = [];
    for (const o of r) n.push(new sN(o));
    return n;
  }
  handleSelect(r) {
    this._adapter.notifySelect(r);
  }
  judgeIfOpen(r, n) {
    let o = !1;
    const a = Array.isArray(r) ? r : r && [r];
    if (a && Array.isArray(n) && n.length) {
      for (const l of n) if (((o = a.includes(l.itemKey) || this.judgeIfOpen(a, l.items)), o)) break;
    }
    return o;
  }
  handleCollapseChange() {
    const r = !this.getState('isCollapsed');
    this._isControlledComponent('isCollapsed') || this._adapter.setIsCollapsed(r),
      this._adapter.notifyCollapseChange(r);
  }
  handleItemsChange(r) {
    this._adapter.setItemsChanged(r);
  }
}
const tS = function () {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
    const n = new Set(r);
    for (var o = arguments.length, a = new Array(o > 1 ? o - 1 : 0), l = 1; l < o; l++) a[l - 1] = arguments[l];
    return a.forEach(c => c && n.add(c)), Array.from(n);
  },
  rS = function () {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
    const n = new Set(r);
    for (var o = arguments.length, a = new Array(o > 1 ? o - 1 : 0), l = 1; l < o; l++) a[l - 1] = arguments[l];
    return a.forEach(c => c && n.delete(c)), Array.from(n);
  };
class lN extends nn {
  constructor(r) {
    super(Object.assign({}, r));
  }
  init() {
    this._timer = null;
  }
  destroy() {
    this.clearDelayTimer();
  }
  clearDelayTimer() {
    this._timer && (clearTimeout(this._timer), (this._timer = null));
  }
  isValidKey(r) {
    return r != null && (typeof r == 'number' || typeof r == 'string');
  }
  handleDropdownVisibleChange(r) {
    const n = this.getProp('itemKey'),
      o = this._adapter.getOpenKeysIsControlled(),
      a = this._adapter.getCanUpdateOpenKeys(),
      l = this._adapter.getOpenKeys(),
      c = r ? tS(l, n) : rS(l, n);
    this.clearDelayTimer(),
      o || (a && this._adapter.updateOpen(r)),
      this._adapter.notifyGlobalOpenChange({ itemKey: n, openKeys: c, isOpen: r });
  }
  handleClick(r, n) {
    const { itemKey: o, disabled: a } = this.getProps();
    if (a) return;
    const l = n && n.contains(r.target);
    let c = !!this._adapter.getIsOpen();
    l ? (c = !c) : (c = !1);
    const d = c ? tS(this._adapter.getOpenKeys(), o) : rS(this._adapter.getOpenKeys(), o),
      h = { itemKey: o, openKeys: d, isOpen: c, domEvent: r },
      g = this._adapter.getOpenKeysIsControlled(),
      y = this._adapter.getCanUpdateOpenKeys();
    !g && y && this._adapter.updateOpen(c),
      this._adapter.notifyGlobalOpenChange(h),
      this._adapter.notifyGlobalOnClick(h);
  }
  handleKeyPress(r, n) {
    El(r) && this.handleClick(r, n);
  }
}
class uN extends nn {
  constructor(r) {
    super(Object.assign({}, r));
  }
  init() {
    (this._timer = null), (this._mounted = !0);
  }
  destroy() {
    this._mounted = !1;
  }
  isValidKey(r) {
    return r != null && (typeof r == 'string' || typeof r == 'number');
  }
  handleClick(r) {
    const { isSubNav: n, itemKey: o, text: a, disabled: l } = this.getProps();
    if (l) return;
    !n &&
      this.isValidKey(o) &&
      !this._adapter.getSelectedKeysIsControlled() &&
      !this._adapter.getSelected() &&
      this._adapter.updateSelected(!0);
    const c = [o];
    if (!n) {
      if (!this._adapter.getSelected()) {
        const d = [this._adapter.cloneDeep(this.getProps())];
        this._adapter.notifyGlobalOnSelect({ itemKey: o, selectedKeys: c, selectedItems: d, domEvent: r });
      }
      this._adapter.notifyGlobalOnClick({ itemKey: o, text: a, domEvent: r });
    }
    this._adapter.notifyClick({ itemKey: o, text: a, domEvent: r });
  }
  handleKeyPress(r) {
    if (El(r)) {
      const { link: n, linkOptions: o } = this.getProps(),
        a = De(o, 'target', '_self');
      this.handleClick(r), typeof n == 'string' && (a === '_blank' ? window.open(n) : (window.location.href = n));
    }
  }
}
const _o = E.createContext({ isCollapsed: !1, selectedKeys: [], openKeys: [] }),
  Gt = `${$r.PREFIX}-item`;
class So extends Rr {
  constructor(r) {
    super(r),
      (this.setItemRef = n => {
        this.props.forwardRef && this.props.forwardRef(n);
      }),
      (this.wrapTooltip = n => {
        const { text: o, tooltipHideDelay: a, tooltipShowDelay: l } = this.props,
          c = a ?? this.context.tooltipHideDelay,
          d = l ?? this.context.tooltipShowDelay;
        return E.createElement(
          zr,
          {
            content: o,
            wrapWhenSpecial: !1,
            position: 'right',
            trigger: 'hover',
            mouseEnterDelay: d,
            mouseLeaveDelay: c,
          },
          n
        );
      }),
      (this.handleClick = n => this.foundation.handleClick(n)),
      (this.handleKeyPress = n => this.foundation.handleKeyPress(n)),
      (this.state = { tooltipShow: !1 }),
      (this.foundation = new uN(this.adapter));
  }
  _invokeContextFunc(r) {
    if (r && this.context && typeof this.context[r] == 'function') {
      for (var n = arguments.length, o = new Array(n > 1 ? n - 1 : 0), a = 1; a < n; a++) o[a - 1] = arguments[a];
      return this.context[r](...o);
    }
    return null;
  }
  get adapter() {
    var r = this;
    return Object.assign(Object.assign({}, super.adapter), {
      cloneDeep: AT,
      updateTooltipShow: n => this.setState({ tooltipShow: n }),
      updateSelected: n => this._invokeContextFunc('updateSelectedKeys', [this.props.itemKey]),
      updateGlobalSelectedKeys: n => this._invokeContextFunc('updateSelectedKeys', [...n]),
      getSelectedKeys: () => this.context && this.context.selectedKeys,
      getSelectedKeysIsControlled: () => this.context && this.context.selectedKeysIsControlled,
      notifyGlobalOnSelect: function () {
        for (var n = arguments.length, o = new Array(n), a = 0; a < n; a++) o[a] = arguments[a];
        return r._invokeContextFunc('onSelect', ...o);
      },
      notifyGlobalOnClick: function () {
        for (var n = arguments.length, o = new Array(n), a = 0; a < n; a++) o[a] = arguments[a];
        return r._invokeContextFunc('onClick', ...o);
      },
      notifyClick: function () {
        return r.props.onClick(...arguments);
      },
      notifyMouseEnter: function () {
        return r.props.onMouseEnter(...arguments);
      },
      notifyMouseLeave: function () {
        return r.props.onMouseLeave(...arguments);
      },
      getIsCollapsed: () => this.props.isCollapsed || !!(this.context && this.context.isCollapsed) || !1,
      getSelected: () =>
        !!(this.context && this.context.selectedKeys && this.context.selectedKeys.includes(this.props.itemKey)),
      getIsOpen: () => !!(this.context && this.context.openKeys && this.context.openKeys.includes(this.props.itemKey)),
    });
  }
  renderIcon(r, n) {
    let o = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !1,
      a = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
    if (this.props.isSubNav || (!r && this.context.mode === Ge.MODE_HORIZONTAL)) return null;
    let l = 'large';
    n === Ge.ICON_POS_RIGHT && (l = 'default');
    const c = de(`${Gt}-icon`, {
      [`${Gt}-icon-toggle-${this.context.toggleIconPosition}`]: o,
      [`${Gt}-icon-info`]: !o,
    });
    return E.createElement('i', { className: c, key: a }, y1(r) ? E.cloneElement(r, { size: r.props.size || l }) : r);
  }
  render() {
    var r;
    const {
        text: n,
        icon: o,
        toggleIcon: a,
        className: l,
        isSubNav: c,
        style: d,
        indent: h,
        onMouseEnter: g,
        onMouseLeave: y,
        link: w,
        linkOptions: S,
        disabled: _,
        level: x = 0,
        tabIndex: T,
      } = this.props,
      { mode: O, isInSubNav: L, prefixCls: I, limitIndent: $ } = this.context,
      H = this.adapter.getIsCollapsed(),
      V = this.adapter.getSelected();
    let F = null;
    const b = (r = this.props) === null || r === void 0 ? void 0 : r.children;
    if (!en(b)) F = b;
    else {
      let W = null;
      if (O === Ge.MODE_VERTICAL && !$ && !H) {
        const X = o && !h ? x : x - 1;
        W = O1(X, G => this.renderIcon(null, Ge.ICON_POS_RIGHT, !1, G));
      }
      F = E.createElement(
        E.Fragment,
        null,
        W,
        this.context.toggleIconPosition === Ge.TOGGLE_ICON_LEFT &&
          this.renderIcon(a, Ge.ICON_POS_RIGHT, !0, 'key-toggle-pos-right'),
        o || h || L ? this.renderIcon(o, Ge.ICON_POS_LEFT, !1, 'key-position-left') : null,
        en(n) ? '' : E.createElement('span', { className: `${$r.PREFIX}-item-text` }, n),
        this.context.toggleIconPosition === Ge.TOGGLE_ICON_RIGHT &&
          this.renderIcon(a, Ge.ICON_POS_RIGHT, !0, 'key-toggle-pos-right')
      );
    }
    typeof w == 'string' &&
      (F = E.createElement('a', Object.assign({ className: `${I}-item-link`, href: w, tabIndex: -1 }, S), F));
    let q = '';
    if (L && (H || O === Ge.MODE_HORIZONTAL)) {
      const W = de({
        [Gt]: !0,
        [`${Gt}-sub`]: c,
        [`${Gt}-selected`]: V,
        [`${Gt}-collapsed`]: H,
        [`${Gt}-disabled`]: _,
      });
      q = E.createElement(
        Lt.Item,
        {
          selected: V,
          active: V,
          forwardRef: this.setItemRef,
          className: W,
          onClick: this.handleClick,
          onMouseEnter: g,
          onMouseLeave: y,
          disabled: _,
          onKeyDown: this.handleKeyPress,
        },
        F
      );
    } else {
      const W = de(`${l || `${Gt}-normal`}`, {
          [Gt]: !0,
          [`${Gt}-sub`]: c,
          [`${Gt}-selected`]: V && !c,
          [`${Gt}-collapsed`]: H,
          [`${Gt}-disabled`]: _,
          [`${Gt}-has-link`]: typeof w == 'string',
        }),
        X = { 'aria-disabled': _ };
      if (c) {
        const G = this.adapter.getIsOpen();
        X['aria-expanded'] = G;
      }
      q = E.createElement(
        'li',
        Object.assign(
          { role: c ? null : 'menuitem', tabIndex: c ? -1 : T },
          X,
          {
            style: d,
            ref: this.setItemRef,
            className: W,
            onClick: this.handleClick,
            onMouseEnter: g,
            onMouseLeave: y,
            onKeyPress: this.handleKeyPress,
          },
          this.getDataAttr(this.props)
        ),
        F
      );
    }
    return (
      ((H && !L && !c) || (H && c && _)) && (q = this.wrapTooltip(q)),
      typeof this.context.renderWrapper == 'function'
        ? this.context.renderWrapper({ itemElement: q, isSubNav: c, isInSubNav: L, props: this.props })
        : q
    );
  }
}
So.contextType = _o;
So.propTypes = {
  text: m.oneOfType([m.string, m.node]),
  itemKey: m.oneOfType([m.string, m.number]),
  onClick: m.func,
  onMouseEnter: m.func,
  onMouseLeave: m.func,
  icon: m.oneOfType([m.node]),
  className: m.string,
  toggleIcon: m.string,
  style: m.object,
  forwardRef: m.func,
  indent: m.oneOfType([m.bool, m.number]),
  isCollapsed: m.bool,
  isSubNav: m.bool,
  link: m.string,
  linkOptions: m.object,
  disabled: m.bool,
  tabIndex: m.number,
};
So.defaultProps = {
  isSubNav: !1,
  indent: !1,
  forwardRef: ze,
  isCollapsed: !1,
  onClick: ze,
  onMouseEnter: ze,
  onMouseLeave: ze,
  disabled: !1,
  tabIndex: 0,
};
class za extends Rr {
  constructor(r) {
    super(r),
      (this.setItemRef = n => {
        n && n.current ? (this.itemRef = n) : (this.itemRef = { current: n });
      }),
      (this.setTitleRef = n => {
        n && n.current ? (this.titleRef = n) : (this.titleRef = { current: n });
      }),
      (this.handleClick = n => {
        this.foundation.handleClick(n && n.nativeEvent, this.titleRef && this.titleRef.current);
      }),
      (this.handleKeyPress = n => {
        this.foundation.handleKeyPress(n && n.nativeEvent, this.titleRef && this.titleRef.current);
      }),
      (this.handleDropdownVisible = n => this.foundation.handleDropdownVisibleChange(n)),
      (this.state = { isHovered: !1 }),
      this.adapter.setCache('firstMounted', !0),
      (this.titleRef = E.createRef()),
      (this.itemRef = E.createRef()),
      (this.foundation = new lN(this.adapter));
  }
  _invokeContextFunc(r) {
    if (r && this.context && typeof this.context[r] == 'function') {
      for (var n = arguments.length, o = new Array(n > 1 ? n - 1 : 0), a = 1; a < n; a++) o[a - 1] = arguments[a];
      return this.context[r](...o);
    }
    return null;
  }
  get adapter() {
    var r = this;
    return Object.assign(Object.assign({}, super.adapter), {
      updateIsHovered: n => this.setState({ isHovered: n }),
      getOpenKeys: () => this.context && this.context.openKeys,
      getOpenKeysIsControlled: () => this.context && this.context.openKeysIsControlled,
      getCanUpdateOpenKeys: () => this.context && this.context.canUpdateOpenKeys,
      updateOpen: n => this._invokeContextFunc(n ? 'addOpenKeys' : 'removeOpenKeys', this.props.itemKey),
      notifyGlobalOpenChange: function () {
        for (var n = arguments.length, o = new Array(n), a = 0; a < n; a++) o[a] = arguments[a];
        return r._invokeContextFunc('onOpenChange', ...o);
      },
      notifyGlobalOnSelect: function () {
        for (var n = arguments.length, o = new Array(n), a = 0; a < n; a++) o[a] = arguments[a];
        return r._invokeContextFunc('onSelect', ...o);
      },
      notifyGlobalOnClick: function () {
        for (var n = arguments.length, o = new Array(n), a = 0; a < n; a++) o[a] = arguments[a];
        return r._invokeContextFunc('onClick', ...o);
      },
      getIsSelected: n => !!(!en(n) && De(this.context, 'selectedKeys', []).includes(String(n))),
      getIsOpen: () => {
        const { itemKey: n } = this.props;
        return !!(this.context && this.context.openKeys && this.context.openKeys.includes(this.props.itemKey));
      },
    });
  }
  renderIcon(r, n, o) {
    let a = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : !1,
      l = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 0;
    const { prefixCls: c } = this.context;
    let d = 'large';
    n === Ge.ICON_POS_RIGHT && (d = 'default');
    const h = de(`${c}-item-icon`, {
        [`${c}-item-icon-toggle-${this.context.toggleIconPosition}`]: a,
        [`${c}-item-icon-info`]: !a,
      }),
      g = this.adapter.getIsOpen(),
      y = E.isValidElement(r)
        ? o
          ? E.createElement(
              Fh,
              { animationState: g ? 'enter' : 'leave', startClassName: `${$r.PREFIX}-icon-rotate-${g ? '180' : '0'}` },
              w => {
                let { animationClassName: S } = w;
                return E.cloneElement(r, { size: d, className: S });
              }
            )
          : E.cloneElement(r, { size: d })
        : null;
    return E.createElement('i', { key: l, className: h }, y);
  }
  renderTitleDiv() {
    const { text: r, icon: n, itemKey: o, indent: a, disabled: l, level: c, expandIcon: d } = this.props,
      { mode: h, isInSubNav: g, isCollapsed: y, prefixCls: w, subNavMotion: S, limitIndent: _ } = this.context,
      x = this.adapter.getIsOpen(),
      T = de(`${w}-sub-title`, {
        [`${w}-sub-title-selected`]: this.adapter.getIsSelected(o),
        [`${w}-sub-title-disabled`]: l,
      });
    let O = !1,
      L = '';
    y
      ? g
        ? (L = E.createElement(j_, null))
        : (L = null)
      : h === Ge.MODE_HORIZONTAL
      ? g
        ? (L = E.createElement(j_, { 'aria-hidden': !0 }))
        : (L = d || E.createElement(L_, { 'aria-hidden': !0 }))
      : (S && (O = !0), (L = d || E.createElement(L_, { 'aria-hidden': !0 })));
    let I = null;
    if (h === Ge.MODE_VERTICAL && !_ && !y) {
      const V = n && !a ? c : c - 1;
      I = O1(V, F => this.renderIcon(null, Ge.ICON_POS_RIGHT, !1, !1, F));
    }
    const $ = (!y && g && h === Ge.MODE_HORIZONTAL) || (y && g);
    return E.createElement(
      'div',
      {
        role: 'menuitem',
        tabIndex: $ ? -1 : 0,
        ref: this.setTitleRef,
        className: T,
        onClick: this.handleClick,
        onKeyPress: this.handleKeyPress,
        'aria-expanded': x ? 'true' : 'false',
      },
      E.createElement(
        'div',
        { className: `${w}-item-inner` },
        I,
        this.context.toggleIconPosition === Ge.TOGGLE_ICON_LEFT &&
          this.renderIcon(L, Ge.ICON_POS_RIGHT, O, !0, 'key-toggle-position-left'),
        n || a || (g && h !== Ge.MODE_HORIZONTAL)
          ? this.renderIcon(n, Ge.ICON_POS_LEFT, !1, !1, 'key-inSubNav-position-left')
          : null,
        E.createElement('span', { className: `${w}-item-text` }, r),
        this.context.toggleIconPosition === Ge.TOGGLE_ICON_RIGHT &&
          this.renderIcon(L, Ge.ICON_POS_RIGHT, O, !0, 'key-toggle-position-right')
      )
    );
  }
  renderSubUl() {
    const { children: r, maxHeight: n } = this.props,
      { isCollapsed: o, mode: a, subNavMotion: l, prefixCls: c } = this.context,
      d = this.adapter.getIsOpen(),
      h = a === Ge.MODE_HORIZONTAL,
      g = de(`${c}-sub`, { [`${c}-sub-open`]: d, [`${c}-sub-popover`]: o || h });
    return h
      ? null
      : l
      ? E.createElement(
          bi,
          { motion: l, isOpen: d, keepDOM: !1, fade: !0 },
          o ? null : E.createElement('ul', { className: g }, r)
        )
      : d && !o
      ? E.createElement('ul', { className: g }, r)
      : null;
  }
  wrapDropdown() {
    let n = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : '';
    const { children: o, dropdownStyle: a, disabled: l, subDropdownProps: c, dropdownProps: d } = this.props,
      {
        mode: h,
        isInSubNav: g,
        isCollapsed: y,
        subNavCloseDelay: w,
        subNavOpenDelay: S,
        prefixCls: _,
        getPopupContainer: x,
      } = this.context,
      T = this.adapter.getIsOpen(),
      O = this.adapter.getOpenKeysIsControlled(),
      L = de({ [`${_}-popover`]: y }),
      I = { trigger: 'hover', style: a };
    return (
      O && ((I.trigger = 'custom'), (I.visible = T)),
      x && (I.getPopupContainer = x),
      (y || h === Ge.MODE_HORIZONTAL) &&
        (n = l
          ? n
          : E.createElement(
              Lt,
              Object.assign(
                {
                  className: L,
                  render: E.createElement(Lt.Menu, null, o),
                  position: h === Ge.MODE_HORIZONTAL && !g ? 'bottomLeft' : 'rightTop',
                  mouseEnterDelay: S,
                  mouseLeaveDelay: w,
                  onVisibleChange: this.handleDropdownVisible,
                },
                d || c,
                I
              ),
              n
            )),
      n
    );
  }
  render() {
    const { itemKey: r, style: n, onMouseEnter: o, onMouseLeave: a, disabled: l, text: c } = this.props,
      { mode: d, isCollapsed: h, prefixCls: g } = this.context;
    let y = this.renderTitleDiv();
    const w = this.renderSubUl();
    return (
      (h || d === Ge.MODE_HORIZONTAL) && (y = this.wrapDropdown(y)),
      E.createElement(
        So,
        {
          style: n,
          isSubNav: !0,
          itemKey: r,
          forwardRef: this.setItemRef,
          isCollapsed: h,
          className: `${g}-sub-wrap`,
          onMouseEnter: o,
          onMouseLeave: a,
          disabled: l,
          text: c,
        },
        E.createElement(
          _o.Provider,
          { value: Object.assign(Object.assign({}, this.context), { isInSubNav: !0 }) },
          y,
          w
        )
      )
    );
  }
}
za.contextType = _o;
za.propTypes = {
  itemKey: m.oneOfType([m.string, m.number]),
  text: m.oneOfType([m.string, m.node]),
  isOpen: m.bool,
  isCollapsed: m.bool,
  indent: m.oneOfType([m.bool, m.number]),
  children: m.node,
  style: m.object,
  icon: m.node,
  maxHeight: m.number,
  onMouseEnter: m.func,
  onMouseLeave: m.func,
  disabled: m.bool,
  level: m.number,
};
za.defaultProps = {
  level: 0,
  indent: !1,
  isCollapsed: !1,
  isOpen: !1,
  maxHeight: to.DEFAULT_SUBNAV_MAX_HEIGHT,
  disabled: !1,
};
function cN(i) {
  let { prefixCls: r, locale: n, collapseText: o, isCollapsed: a, onClick: l = ze } = i;
  const c = () => {
      typeof l == 'function' && l(!a);
    },
    d = { icon: E.createElement(GR, null), type: 'tertiary', theme: 'borderless', onClick: c };
  let h = a ? n?.expandText : n?.collapseText;
  return (
    typeof o == 'function' && (h = o(a)),
    E.createElement(
      'div',
      { className: `${r}-collapse-btn` },
      a
        ? E.createElement(
            zr,
            { content: h, position: 'right' },
            E.createElement('span', { className: `${r}-collapse-wrapper` }, E.createElement(Ei, Object.assign({}, d)))
          )
        : E.createElement(Ei, Object.assign({}, d), h)
    )
  );
}
class Qn extends A.PureComponent {
  constructor() {
    super(...arguments),
      (this.renderCollapseButton = () => {
        const { collapseButton: r, collapseText: n } = this.props;
        if (E.isValidElement(r)) return r;
        const { onCollapseChange: o, prefixCls: a, locale: l, isCollapsed: c } = this.context;
        return E.createElement(cN, { prefixCls: a, isCollapsed: c, locale: l, onClick: o, collapseText: n });
      });
  }
  render() {
    const { style: r, className: n, collapseButton: o, onClick: a } = this.props;
    let { children: l } = this.props;
    const { isCollapsed: c, mode: d } = this.context;
    !E.isValidElement(l) && o && d !== Ge.MODE_HORIZONTAL && (l = this.renderCollapseButton());
    const h = de(n, `${$r.PREFIX}-footer`, { [`${$r.PREFIX}-footer-collapsed`]: c });
    return E.createElement('div', { className: h, style: r, onClick: a }, l);
  }
}
Qn.contextType = _o;
Qn.propTypes = {
  children: m.node,
  style: m.object,
  className: m.string,
  collapseButton: m.oneOfType([m.node, m.bool]),
  collapseText: m.func,
  onClick: m.func,
};
Qn.defaultProps = { collapseButton: !1, onClick: ze };
Qn.elementType = 'NavFooter';
class Zn extends A.PureComponent {
  renderLogo(r) {
    return E.isValidElement(r) ? r : null;
  }
  render() {
    const { children: r, style: n, className: o, logo: a, text: l, link: c, linkOptions: d, prefixCls: h } = this.props,
      { isCollapsed: g } = this.context,
      y = de(o, `${$r.PREFIX}-header`, { [`${$r.PREFIX}-header-collapsed`]: g });
    let w = E.createElement(
      E.Fragment,
      null,
      a ? E.createElement('i', { className: `${$r.PREFIX}-header-logo` }, this.renderLogo(a)) : null,
      !en(l) && !g ? E.createElement('span', { className: `${$r.PREFIX}-header-text` }, l) : null,
      r
    );
    return (
      typeof c == 'string' &&
        (w = E.createElement('a', Object.assign({ className: `${h}-header-link`, href: c }, d), w)),
      E.createElement('div', { className: y, style: n }, w)
    );
  }
}
Zn.contextType = _o;
Zn.propTypes = {
  prefixCls: m.string,
  logo: m.oneOfType([m.string, m.object, m.node]),
  text: m.oneOfType([m.string, m.node]),
  children: m.node,
  style: m.object,
  className: m.string,
  link: m.string,
  linkOptions: m.object,
};
Zn.defaultProps = { prefixCls: $r.PREFIX };
Zn.elementType = 'NavHeader';
var dN = function (i, r) {
  var n = {};
  for (var o in i) Object.prototype.hasOwnProperty.call(i, o) && r.indexOf(o) < 0 && (n[o] = i[o]);
  if (i != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var a = 0, o = Object.getOwnPropertySymbols(i); a < o.length; a++)
      r.indexOf(o[a]) < 0 && Object.prototype.propertyIsEnumerable.call(i, o[a]) && (n[o[a]] = i[o[a]]);
  return n;
};
function nS(i, r) {
  return function () {
    const o = new Set(i.state[r]);
    for (var a = arguments.length, l = new Array(a), c = 0; c < a; c++) l[c] = arguments[c];
    l.forEach(d => d && o.add(d)), i.setState({ [r]: Array.from(o) });
  };
}
function iS(i, r) {
  return function () {
    const o = new Set(i.state[r]);
    for (var a = arguments.length, l = new Array(a), c = 0; c < a; c++) l[c] = arguments[c];
    l.forEach(d => d && o.delete(d)), i.setState({ [r]: Array.from(o) });
  };
}
const { hasOwnProperty: fN } = Object.prototype;
class Sn extends Rr {
  constructor(r) {
    super(r),
      (this.onCollapseChange = () => {
        this.foundation.handleCollapseChange();
      }),
      (this.foundation = new ro(this.adapter)),
      (this.itemsChanged = !0);
    const { isCollapsed: n, defaultIsCollapsed: o, items: a, children: l } = r,
      c = {
        isCollapsed: !!(this.isControlled('isCollapsed') ? n : o),
        openKeys: [],
        items: [],
        itemKeysMap: {},
        selectedKeys: [],
      };
    if (((this.state = Object.assign({}, c)), (a && a.length) || l)) {
      const d = this.foundation.init('constructor');
      this.state = Object.assign(Object.assign({}, c), d);
    }
  }
  static getDerivedStateFromProps(r, n) {
    const o = {};
    return fN.call(r, 'isCollapsed') && r.isCollapsed !== n.isCollapsed && (o.isCollapsed = r.isCollapsed), o;
  }
  componentDidMount() {}
  componentDidUpdate(r) {
    if (r.items !== this.props.items || r.children !== this.props.children) this.foundation.init();
    else {
      if (
        (this.foundation.handleItemsChange(!1), this.props.selectedKeys && !oo(r.selectedKeys, this.props.selectedKeys))
      ) {
        this.adapter.updateSelectedKeys(this.props.selectedKeys);
        const n = this.foundation.getWillOpenKeys(this.state.itemKeysMap);
        this.adapter.updateOpenKeys(n);
      }
      this.props.openKeys && !oo(r.openKeys, this.props.openKeys) && this.adapter.updateOpenKeys(this.props.openKeys);
    }
  }
  get adapter() {
    var r = this;
    return Object.assign(Object.assign({}, super.adapter), {
      notifySelect: function () {
        return r.props.onSelect(...arguments);
      },
      notifyOpenChange: function () {
        return r.props.onOpenChange(...arguments);
      },
      setIsCollapsed: n => this.setState({ isCollapsed: n }),
      notifyCollapseChange: function () {
        return r.props.onCollapseChange(...arguments);
      },
      updateItems: n => this.setState({ items: [...n] }),
      setItemKeysMap: n => this.setState({ itemKeysMap: Object.assign({}, n) }),
      addSelectedKeys: nS(this, 'selectedKeys'),
      removeSelectedKeys: iS(this, 'selectedKeys'),
      updateSelectedKeys: function (n) {
        let o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0,
          a = n;
        if (o) {
          const l = r.foundation.selectLevelZeroParentKeys(null, n);
          a = Array.from(new Set(n.concat(l)));
        }
        r.setState({ selectedKeys: a });
      },
      updateOpenKeys: n => this.setState({ openKeys: [...n] }),
      addOpenKeys: nS(this, 'openKeys'),
      removeOpenKeys: iS(this, 'openKeys'),
      setItemsChanged: n => {
        this.itemsChanged = n;
      },
    });
  }
  renderItems() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [],
      n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    const { expandIcon: o, subDropdownProps: a } = this.props;
    return E.createElement(
      E.Fragment,
      null,
      r.map((c, d) =>
        Array.isArray(c.items) && c.items.length
          ? E.createElement(
              za,
              Object.assign({ key: c.itemKey || String(n) + d }, c, { level: n, expandIcon: o, subDropdownProps: a }),
              this.renderItems(c.items, n + 1)
            )
          : E.createElement(So, Object.assign({ key: c.itemKey || String(n) + d }, c, { level: n }))
      )
    );
  }
  render() {
    const r = this.props,
      {
        children: n,
        mode: o,
        onOpenChange: a,
        onSelect: l,
        onClick: c,
        style: d,
        className: h,
        subNavCloseDelay: g,
        subNavOpenDelay: y,
        subNavMotion: w,
        tooltipShowDelay: S,
        tooltipHideDelay: _,
        prefixCls: x,
        bodyStyle: T,
        footer: O,
        header: L,
        toggleIconPosition: I,
        limitIndent: $,
        renderWrapper: H,
        getPopupContainer: V,
      } = r,
      F = dN(r, [
        'children',
        'mode',
        'onOpenChange',
        'onSelect',
        'onClick',
        'style',
        'className',
        'subNavCloseDelay',
        'subNavOpenDelay',
        'subNavMotion',
        'tooltipShowDelay',
        'tooltipHideDelay',
        'prefixCls',
        'bodyStyle',
        'footer',
        'header',
        'toggleIconPosition',
        'limitIndent',
        'renderWrapper',
        'getPopupContainer',
      ]),
      { selectedKeys: b, openKeys: q, items: W, isCollapsed: X } = this.state,
      {
        updateOpenKeys: G,
        addOpenKeys: oe,
        removeOpenKeys: ie,
        updateSelectedKeys: fe,
        addSelectedKeys: me,
        removeSelectedKeys: be,
      } = this.adapter,
      Te = Object.assign({}, d);
    let U = A.Children.toArray(n);
    const te = [],
      ee = [];
    if (
      (E.isValidElement(O)
        ? te.push(E.createElement(Qn, { key: 0 }, O))
        : O && typeof O == 'object' && te.push(E.createElement(Qn, Object.assign({ key: 0 }, O))),
      E.isValidElement(L)
        ? ee.push(E.createElement(Zn, { key: 0 }, L))
        : L && typeof L == 'object' && ee.push(E.createElement(Zn, Object.assign({ key: 0 }, L))),
      Array.isArray(U) && U.length)
    ) {
      U = [...U];
      let le = U.length;
      for (let se = 0; se < le; se++) {
        const pe = U[se];
        pe.type === Qn || De(pe, 'type.elementType') === 'NavFooter'
          ? (te.push(pe), U.splice(se, 1), se--, le--)
          : (pe.type === Zn || De(pe, 'type.elementType') === 'NavHeader') &&
            (ee.push(pe), U.splice(se, 1), se--, le--);
      }
    }
    const k = de(x, h, {
        [`${x}-collapsed`]: X,
        [`${x}-horizontal`]: o === 'horizontal',
        [`${x}-vertical`]: o === 'vertical',
      }),
      K = de(`${x}-header-list-outer`, { [`${x}-header-list-outer-collapsed`]: X });
    return (
      this.itemsChanged && this.adapter.setCache('itemElems', this.renderItems(W)),
      E.createElement(so, { componentName: 'Navigation' }, le =>
        E.createElement(
          _o.Provider,
          {
            value: {
              subNavCloseDelay: g,
              subNavOpenDelay: y,
              subNavMotion: w,
              tooltipShowDelay: S,
              tooltipHideDelay: _,
              openKeys: q,
              openKeysIsControlled: this.isControlled('openKeys') && o === 'vertical' && !X,
              canUpdateOpenKeys: !0,
              selectedKeys: b,
              selectedKeysIsControlled: this.isControlled('selectedKeys'),
              isCollapsed: X,
              onCollapseChange: this.onCollapseChange,
              mode: o,
              onSelect: l,
              onOpenChange: a,
              updateOpenKeys: G,
              addOpenKeys: oe,
              removeOpenKeys: ie,
              updateSelectedKeys: fe,
              addSelectedKeys: me,
              removeSelectedKeys: be,
              onClick: c,
              locale: le,
              prefixCls: x,
              toggleIconPosition: I,
              limitIndent: $,
              renderWrapper: H,
              getPopupContainer: V,
            },
          },
          E.createElement(
            'div',
            Object.assign({ className: k, style: Te }, this.getDataAttr(F)),
            E.createElement(
              'div',
              { className: `${x}-inner` },
              E.createElement(
                'div',
                { className: K },
                ee,
                E.createElement(
                  'div',
                  { style: T, className: `${x}-list-wrapper` },
                  E.createElement(
                    'ul',
                    { role: 'menu', 'aria-orientation': o, className: `${x}-list` },
                    this.adapter.getCache('itemElems'),
                    U
                  )
                )
              ),
              te
            )
          )
        )
      )
    );
  }
}
Sn.Sub = za;
Sn.Item = So;
Sn.Header = Zn;
Sn.Footer = Qn;
Sn.propTypes = {
  collapseIcon: m.node,
  defaultOpenKeys: m.arrayOf(m.oneOfType([m.string, m.number])),
  openKeys: m.arrayOf(m.oneOfType([m.string, m.number])),
  defaultSelectedKeys: m.arrayOf(m.oneOfType([m.string, m.number])),
  expandIcon: m.node,
  selectedKeys: m.arrayOf(m.oneOfType([m.string, m.number])),
  mode: m.oneOf([...Ge.MODE]),
  onSelect: m.func,
  onClick: m.func,
  onOpenChange: m.func,
  items: m.array,
  isCollapsed: m.bool,
  defaultIsCollapsed: m.bool,
  onCollapseChange: m.func,
  multiple: m.bool,
  onDeselect: m.func,
  subNavMotion: m.oneOfType([m.bool, m.object, m.func]),
  subNavCloseDelay: m.number,
  subNavOpenDelay: m.number,
  tooltipShowDelay: m.number,
  tooltipHideDelay: m.number,
  children: m.node,
  style: m.object,
  bodyStyle: m.object,
  className: m.string,
  toggleIconPosition: m.string,
  prefixCls: m.string,
  header: m.oneOfType([m.node, m.object]),
  footer: m.oneOfType([m.node, m.object]),
  limitIndent: m.bool,
  getPopupContainer: m.func,
};
Sn.__SemiComponentName__ = 'Navigation';
Sn.defaultProps = Pi(Sn.__SemiComponentName__, {
  subNavCloseDelay: to.DEFAULT_SUBNAV_CLOSE_DELAY,
  subNavOpenDelay: to.DEFAULT_SUBNAV_OPEN_DELAY,
  tooltipHideDelay: to.DEFAULT_TOOLTIP_HIDE_DELAY,
  tooltipShowDelay: to.DEFAULT_TOOLTIP_SHOW_DELAY,
  onCollapseChange: ze,
  onSelect: ze,
  onClick: ze,
  onOpenChange: ze,
  toggleIconPosition: 'right',
  limitIndent: !0,
  prefixCls: $r.PREFIX,
  subNavMotion: !0,
  mode: Ge.MODE_VERTICAL,
});
const { Meta: pN } = Ma;
function hN() {
  return Zr.jsxs('div', {
    style: { width: '100%' },
    children: [
      Zr.jsx(Sn, {
        header: { logo: Zr.jsx(VR, { style: { height: '36px', fontSize: 36 } }), text: '我的应用' },
        mode: 'horizontal',
      }),
      Zr.jsx('div', {
        style: { marginTop: 16, display: 'flex', gap: 8 },
        children: Zr.jsx(Ma, {
          style: { width: 220 },
          shadows: 'hover',
          children: Zr.jsx(pN, {
            title: '我的115',
            avatar: Zr.jsx(co, {
              alt: 'Card meta img',
              size: 'default',
              src: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/card-meta-avatar-docs-demo.jpg',
            }),
          }),
        }),
      }),
    ],
  });
}
const mN = TO([{ path: '/', element: Zr.jsx(hN, {}) }]);
gb.createRoot(document.getElementById('root')).render(Zr.jsx(A.StrictMode, { children: Zr.jsx(zO, { router: mN }) }));
