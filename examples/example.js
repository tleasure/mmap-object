// Example: writing and reading data with mmap-object.
//
// mmap-object has two distinct modes and you must respect the split:
//   - Shared.Create(path)  -> write mode. One process, writes go to the file.
//   - Shared.Open(path)    -> read-only mode. Many processes may open safely.
// You cannot share a Create()'d object across processes, and you cannot
// write through an Open()'d one. So the pattern is always: create + write +
// close, then open + read.
//
// Run with:  node examples/example.js

// In your own project this is simply:  const Shared = require('mmap-object')
// This example lives inside the repo, so it falls back to the local build.
let Shared
try {
  Shared = require('mmap-object')
} catch (e) {
  Shared = require('../lib/mmap-object.node')
}
const os = require('os')
const path = require('path')

const file = path.join(os.tmpdir(), 'mmap-example.db')

// ---------------------------------------------------------------------------
// 1. ADDING DATA  (write mode)
// ---------------------------------------------------------------------------
//
// Create(path, [file_size_kb], [initial_bucket_count], [max_file_size_kb]).
// Pass the expected number of keys as the 3rd arg — it pre-sizes the hash
// table and avoids slow, fragmenting resizes as you fill it.
const writer = new Shared.Create(file, 500 /* KB */, 300 /* expected keys */)

// Values may be string, buffer, or number only. Anything else throws.
writer['greeting'] = 'hello world'          // string
writer.count = 42                            // number
writer.blob = Buffer.from('unicode ™ bytes') // buffer (fastest for big values)

// Bracket or dot syntax both work; keys are arbitrary strings.
writer['user:1001'] = 'Ada Lovelace'

// Delete a key you no longer want.
writer['count'] = 99
delete writer['user:1001']

// close() on a Create()'d object shrinks the file to fit before unmapping.
// Always close in long-running processes or shared memory leaks.
writer.close()
console.log('wrote', file)

// ---------------------------------------------------------------------------
// 2. READING DATA  (read-only mode)
// ---------------------------------------------------------------------------
//
// Open() maps the existing file. Lazily paged in, so opening is instant even
// for huge files. Safe to open from many processes at once.
const reader = new Shared.Open(file)

console.log('greeting:', reader.greeting)   // hello world
console.log('count:', reader.count)         // 99
console.log('blob:', reader.blob.toString()) // unicode ™ bytes

// Iterate every key/value pair (ES6 iterable protocol).
console.log('--- all entries ---')
for (const [key, value] of reader) {
  console.log(`${key} => ${value}`)
}

// Some handy introspection.
console.log('size (bytes):', reader.get_size())
console.log('free (bytes):', reader.get_free_memory())

// ---------------------------------------------------------------------------
// 3. CHECKING FOR A KEY
// ---------------------------------------------------------------------------
//
// `in` and hasOwnProperty() correctly report presence: the property-query
// interceptor does a real hash lookup and tells V8 the key is absent when it
// isn't in the map. (Note: this costs a hash lookup, like a get would.)
console.log('--- existence checks ---')
console.log("'greeting' in reader   =", 'greeting' in reader)   // true  — present
console.log("'nope' in reader       =", 'nope' in reader)       // false — absent
console.log('hasOwnProperty(nope)   =', Object.prototype.hasOwnProperty.call(reader, 'nope')) // false

// You can also just get the value and compare to undefined. A miss is cheap:
// the getter does one hash lookup, finds nothing, and returns undefined
// WITHOUT allocating any V8 value. The string/JSON copy happens only on a HIT.
console.log("reader.greeting !== undefined =", reader.greeting !== undefined) // true  — present
console.log("reader.nope !== undefined     =", reader.nope !== undefined)     // false — absent

// If you need the value when present, don't "check then get" — that reads the
// key twice (two hash lookups, and on a hit two string copies). Getting once
// into a local both tests presence and gives you the value:
const raw = reader.greeting            // single lookup / single copy
if (raw !== undefined) {
  console.log('got value once:', raw)
}

reader.close()
