// Node kinds: the registry (kindRegistry.js), with SEAMONSTER's own kinds
// defined in it (builtinKinds.js). Import from here, so the built-ins are
// always there first.

import './builtinKinds.js'

export * from './kindRegistry.js'
