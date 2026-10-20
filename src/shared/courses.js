// Docs: docs/social/lecture-tutor.md
// The CS course catalogue, shared by the lecture hall (server/lecture.js), the tutoring room
// (server/tutor.js) and the course menu in the browser. Each course's syllabus is taught / quizzed in order.

export const COURSES = [
  { id: 'cs101', code: 'CS 101', name: 'Intro to Programming', blurb: 'Variables, loops, functions — your first programs.',
    syllabus: ['Variables and types', 'Conditionals', 'Loops', 'Functions', 'Lists and dictionaries', 'Debugging and testing', 'Recursion', 'Objects and classes'] },
  { id: 'ds', code: 'CS 201', name: 'Data Structures', blurb: 'How to organise data so programs stay fast.',
    syllabus: ['Arrays and linked lists', 'Stacks and queues', 'Hash tables', 'Trees and binary search trees', 'Heaps and priority queues', 'Graphs', 'Balanced trees', 'Choosing the right structure'] },
  { id: 'discrete', code: 'CS 202', name: 'Discrete Mathematics', blurb: 'Logic, proofs and counting — the maths of computing.',
    syllabus: ['Propositional logic', 'Proof techniques', 'Sets and functions', 'Mathematical induction', 'Counting and combinatorics', 'Discrete probability', 'Relations', 'Graph theory'] },
  { id: 'arch', code: 'CS 210', name: 'Computer Architecture', blurb: 'From logic gates to CPUs, caches and pipelines.',
    syllabus: ['Binary and number representation', 'Logic gates and circuits', 'The CPU and the instruction cycle', 'Assembly language', 'Memory hierarchy and caches', 'Pipelining', 'I/O and interrupts', 'Multicore and parallelism'] },
  { id: 'algo', code: 'CS 301', name: 'Algorithms', blurb: 'Sorting, searching, greedy tricks and dynamic programming.',
    syllabus: ['Big-O analysis', 'Sorting algorithms', 'Binary search', 'Divide and conquer', 'Greedy algorithms', 'Dynamic programming', 'Graph search: BFS and DFS', 'Shortest paths'] },
  { id: 'os', code: 'CS 310', name: 'Operating Systems', blurb: 'Processes, scheduling, memory and files.',
    syllabus: ['Processes and threads', 'CPU scheduling', 'Synchronisation and locks', 'Deadlock', 'Virtual memory and paging', 'File systems', 'System calls', 'Isolation and security'] },
  { id: 'net', code: 'CS 320', name: 'Computer Networks', blurb: 'How data crosses the internet, layer by layer.',
    syllabus: ['The layered model', 'Links and Ethernet', 'IP addressing and routing', 'TCP and UDP', 'DNS', 'HTTP and the web', 'Congestion control', 'TLS and network security'] },
  { id: 'db', code: 'CS 330', name: 'Databases', blurb: 'Tables, SQL, indexes and transactions.',
    syllabus: ['The relational model', 'SQL queries', 'Joins', 'Keys and normalisation', 'Indexes', 'Transactions and ACID', 'Concurrency control', 'NoSQL databases'] },
  { id: 'theory', code: 'CS 340', name: 'Theory of Computation', blurb: 'Automata, Turing machines and P vs NP.',
    syllabus: ['Finite automata', 'Regular expressions', 'Context-free grammars', 'Turing machines', 'Decidability and the halting problem', 'Complexity classes P and NP', 'NP-completeness', 'Reductions'] },
  { id: 'se', code: 'CS 350', name: 'Software Engineering', blurb: 'Building real software as a team.',
    syllabus: ['Requirements', 'Version control with git', 'Testing', 'Clean code and code review', 'Design patterns', 'Agile and teamwork', 'Debugging in practice', 'Deployment and DevOps'] },
  { id: 'sec', code: 'CS 360', name: 'Computer Security', blurb: 'Crypto, passwords and how systems get attacked.',
    syllabus: ['Threat models', 'Symmetric cryptography', 'Hashing and password storage', 'Public-key cryptography', 'Web vulnerabilities: XSS and SQL injection', 'Authentication', 'Network attacks', 'Secure design principles'] },
  { id: 'ml', code: 'CS 470', name: 'Machine Learning & Neural Networks', blurb: 'Neurons, backprop, CNNs and transformers.',
    syllabus: ['Perceptrons and neurons', 'Activation functions', 'Backpropagation', 'Gradient descent', 'Overfitting and regularisation', 'Convolutional networks', 'Transformers and attention', 'Training at scale'] },
];

export const courseById = (id) => COURSES.find((c) => c.id === id);
export const BREAK = 'break'; // the tutoring room's "take a break" vote
