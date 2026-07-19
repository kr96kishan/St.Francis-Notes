export type Topic = { id: string; title: string; content: string };
export type Chapter = { id: string; title: string; topics: Topic[] };
export type Subject = { id: string; title: string; code: string; chapters: Chapter[] };
export type Semester = { id: string; number: number; title: string; subjects: Subject[] };

const rawSyllabus = {
  "Semester 1": [
    {
      "subject": "Discrete Structures",
      "units": [
        { "name": "UNIT – I (Set Theory)", "topics": ["Fundamentals of Set theory", "Set Operations", "Laws of Set Theory", "Counting and Venn Diagrams", "Cartesian Product", "Relations", "Types of Relations", "Functions", "Types of Functions", "Function Composition", "Inverse Functions", "Mathematical Induction"] },
        { "name": "UNIT – II (Logic and Counting)", "topics": ["Fundamentals of Logic", "Propositional Logic", "Logical Connectives and Truth Tables", "Logic Equivalence", "Tautology and Contradiction", "Basics of counting", "Counting Principles", "Pigeonhole Principle", "Permutation", "Combinations"] },
        { "name": "UNIT - III (Matrices)", "topics": ["Basics of Matrix", "Types of Matrices", "Operations on Matrices", "Inverse of a matrix", "Solution for system of linear equations", "Determinant", "Properties of Determinant", "Cramer’s Rule", "Introduction to Eigen Values and Eigen Vectors"] },
        { "name": "UNIT - IV (Graph Theory & Trees)", "topics": ["Graphs: Introduction", "Representing Graphs", "Operations on graphs", "Directed Graphs", "Graph Isomorphism", "Paths", "Cycles", "Euler Graph", "Hamilton Graph", "Planar Graphs", "Trees: Introduction", "Applications of Trees", "Spanning Trees", "Minimum Spanning Trees", "Prim’s and Kruskal’s Algorithms"] }
      ]
    },
    {
      "subject": "Problem Solving Techniques",
      "units": [
        { "name": "UNIT – I (Introduction & Fundamental Algorithms)", "topics": ["The Role of Algorithms in computing", "Algorithms as a technology", "Analyzing algorithms", "Designing algorithms", "Growth of Functions", "Asymptotic notation", "Standard notations and common functions", "Exchanging the values of two variables", "Counting", "Summation of a set of numbers", "Factorial Computation", "Generating of Fibonacci sequence", "Reversing the digits of an integer", "Character to number conversion"] },
        { "name": "UNIT - II (C Programming)", "topics": ["Getting Started", "Variables", "Operators and Arithmetic expressions", "Standard input and output", "Formatted input and output", "Statements and Blocks", "Selection statements (If, If-else, Ladder, Nested)", "Switch statement", "Control structures (While, For, Do-While)", "Break and Continue", "Goto and labels", "Pointers and addresses", "Pointers and function arguments", "One Dimensional array", "Two-Dimensional array", "Multidimensional array", "Command line arguments"] },
        { "name": "UNIT - III (Factoring Methods & Array Techniques)", "topics": ["Finding the square root of a number", "Smallest Divisor of an integer", "Greatest common divisor (GCD) of two integers", "Computing the prime factor of an integer", "Raising a number to a large power", "Array order reversal", "Array counting", "Finding the maximum number in a set", "Removal of duplicates from an ordered array", "Partitioning an array", "Finding the Kth smallest element", "Multiplication of two matrices"] },
        { "name": "UNIT - IV (Sorting, Searching & Text Processing)", "topics": ["Sorting by selection", "Sorting by exchange", "Sorting by insertion", "Sorting by diminishing increment", "Sorting by partitioning", "Linear Search", "Binary search", "Hash search", "Text line length adjustment", "Keyboard searching in text", "Text line editing", "Linear pattern searching"] }
      ]
    },
    {
      "subject": "Computer Architecture",
      "units": [
        { "name": "UNIT - I (Number Systems & Digital Logic)", "topics": ["Decimal, Binary, Hexadecimal, Octal System", "Number System Conversions", "Binary Arithmetic", "Complements (r's and r-1's)", "Addition and subtraction of BCD", "Octal and Hexadecimal Arithmetic", "Binary Codes and Decimal Codes", "Error detecting and correcting codes", "ASCII, EBCDIC, UNICODE", "Digital Computers & Logic Gates", "Universal Gates", "Boolean algebra & Map Simplification"] },
        { "name": "UNIT - II (Combinational & Sequential Circuits)", "topics": ["Half Adder and Full Adder", "SR, D, J-K, T Flip-Flops", "Sequential Circuits & Input equations", "State Table and State Diagram", "Integrated Circuits (ICs)", "Decoders (3-to-8-line, NAND)", "Octal to Binary Encoder", "Multiplexers (4-to-1-line)", "Registers (4-bit with parallel load)", "Shift Registers (Bidirectional)", "Binary Counters (4-bit synchronous)"] },
        { "name": "UNIT - III (Basic Computer Organization & CPU)", "topics": ["Instruction Codes & Computer Registers", "Computer Instructions", "Timing and Control & Instruction Cycle", "Memory-Reference Instructions", "Input-Output Interrupt", "Complete Computer Description", "Design of Basic Computer", "Design of Accumulator logic", "General Register Organization", "Stack Organization & Instruction Formats", "Addressing Modes", "Data Transfer and Manipulation", "Program Control", "RISC vs CISC Architecture"] },
        { "name": "UNIT - IV (8085 Assembly Language)", "topics": ["Architecture of 8085 & Pin Configuration", "The 8085 Programming Model", "Instruction classification & formats", "Instruction set overview", "Data Transfer and Arithmetic operations", "Logic and Branch operations", "Writing Assembly language programs", "Addressing modes of 8085"] }
      ]
    },
    {
      "subject": "Problem Solving Technique Lab",
      "isLab": true,
      "units": [
        { "name": "Lab Programs", "topics": ["1. Write and execute C Program basics", "2. Read radius of circle & find area/circumference", "3. Read numbers and find biggest of three", "4. Check whether a number is prime or not", "5. Find the roots of a quadratic equation", "6. Sum of digits, reverse number, and check palindrome", "7. Read positive numbers continuously till 999", "8. Read percentage and display grade message", "9. Simulate a simple calculator using switch case", "10. Read marks of N students and find average", "11. Remove duplicate elements from a 1D array", "12. Find the factorial of a number using recursion", "13. Generate Fibonacci series", "14. String functions (Length, Copy, Concat, Compare)", "15. Find length of string without built-in function", "16. Read, display and add two n x m matrices", "17. Count alphabets, digits, vowels, consonants, spaces", "18. Swap two numbers using pointers", "19. Student structure to read & display records", "20. Difference between Structure and Union", "21. Design star pattern using nested loops"] }
      ]
    },
    {
      "subject": "Computer Architecture Lab",
      "isLab": true,
      "units": [
        { "name": "8085 Microprocessor Programs", "topics": ["1. Swap two 8-bit numbers", "2. Find largest and smallest of two numbers", "3. Find if 8-bit number is positive, negative or zero", "4. Check whether 4th bit of a number is 0 or 1", "5. Calculate sum of first ten natural numbers", "6. Find sum of digits of an 8-bit number", "7. Find the reverse of an 8-bit number", "8. Check if 1-byte number is a palindrome", "9. Check whether a number is ODD or EVEN", "10. Count number of ones in an 8-bit number", "11. Addition & Subtraction of two 8-bit HEX numbers", "12. Addition of two 16-bit numbers", "13. Subtraction of two 16-bit numbers", "14. Swapping of two 16-bit numbers", "15. Implement 2 out of 5 codes", "16. Generate Fibonacci series", "17. Find first ten terms of odd and even numbers", "18. 4-Digit BCD addition", "19. Multiplication of 2-digit BCD numbers", "20. Division of two 8-bit numbers"] }
      ]
    },
    {
      "subject": "OAT Lab",
      "isLab": true,
      "units": []
    }
  ],
  "Semester 2": [
    {
      "subject": "Data Structures",
      "units": [
        { "name": "UNIT - I (Introduction & Preliminaries)", "topics": ["Definition and Elementary Data Organization", "Data Structure Operations & ADTs", "Algorithm Complexity & Time-Space Tradeoff", "Mathematical & Algorithmic Notations", "Control structures", "Asymptotic notations", "Introduction to Strings & Character Data Types", "String Operations & Word processing", "Pattern matching algorithms"] },
        { "name": "UNIT - II (Arrays & Linked Lists)", "topics": ["Linear Arrays & Arrays as ADT", "Representation of Linear Arrays in Memory", "Traversing, Inserting, and Deleting in Arrays", "Multidimensional Arrays", "Matrices and Sparse matrices", "Searching and sorting techniques using arrays", "Singly Linked List Definition & Representation", "Traversing and Searching in Linked Lists", "Memory allocation & Garbage collection", "Insertion and Deletion in Singly Linked Lists", "Doubly, Header, and Circular Linked Lists"] },
        { "name": "UNIT - III (Stacks & Queues)", "topics": ["Stack Definition & Memory Representation", "Linked Representation of Stacks & Stack as ADT", "Polish Notation & Infix to Postfix", "Evaluation of Postfix Expressions", "Application of Stacks & Recursion", "Towers of Hanoi", "Queue Definition & Memory Representation", "Linked Representation of Queues", "Simple, Circular, Double-ended, and Priority Queues", "Operations on Queues & Applications"] },
        { "name": "UNIT - IV (Trees, Graphs & Hashing)", "topics": ["Binary Trees Definition & Traversals", "Tree Search & Tree Sort", "Binary Search Trees (BST)", "AVL Trees & Heaps", "Red-Black Trees", "B-Trees & Multi-way search", "Graphs Representation & Traversals", "Hash Tables & Hash Functions", "Collision Resolution Techniques"] }
      ]
    },
    {
      "subject": "Object Oriented Programming Using Java",
      "units": [
        { "name": "UNIT - I (Java Basics & OOP Foundations)", "topics": ["Basics of OOP & Paradigm Comparison", "Difference between C and Java", "Features of Java & JVM", "Objects and Classes in Java", "Structure of a Java program", "Data Types, Variables, and Operators", "Control Structures (Branching, Looping)", "Methods & Constructors in Java", "Java Development Kit (JDK)", "Built-in classes (Math, Character, String, StringBuffer)", "Wrapper classes & Scanner class", "Abstract, Static, and Final classes", "Casting objects & Instanceof operator", "Usage of 'this' keyword", "Arrays in Java"] },
        { "name": "UNIT - II (Inheritance, Packages & I/O)", "topics": ["Super and Subclasses & visibility modifiers", "Types of Inheritance (Single, Multiple, Hierarchical, Hybrid)", "Interfaces in Java", "Polymorphism (Compile-time & Run-time)", "Method Overloading & Method Overriding", "Types of Packages", "Util, Awt, and Swing Packages", "Creating and importing user-defined packages", "Standard I/O Streams in Java", "File and Byte Stream Operations"] },
        { "name": "UNIT - III (Event Handling, GUI & Applets)", "topics": ["Major events in Java & delegation model", "Event Classes and Listener Interfaces", "Mouse and Keyboard Events", "GUI Panels, Frames, and Layout Managers", "Buttons, Checkboxes, Radio Buttons, Labels", "Text Fields, Text Areas, Combo Boxes", "Scroll Bars, Sliders, Menus, Dialog Boxes", "Applet Programming & Life Cycle", "Developing and running Applets", "String Operations & Comparison"] },
        { "name": "UNIT - IV (Exception Handling, Threads & Collections)", "topics": ["Types of Java Exceptions (Checked & Unchecked)", "Usage of try-catch-finally blocks", "Multithreading vs Multitasking", "Thread Life Cycle", "Creating Threads (Thread class & Runnable)", "Thread Synchronization", "Collections in Java", "JavaBeans Introduction", "Java Security Manager", "Generic Programming Basics"] }
      ]
    },
    {
      "subject": "Operating System",
      "units": [
        { "name": "UNIT - I (OS structures & Processes)", "topics": ["Computer System Organization & Architecture", "Operating System Operations & structures", "Process, Memory, and Storage Management", "OS Services, System Calls, and Boot", "Process Concept & Process Scheduling", "Operations on Processes & IPC", "Multithreading Models"] },
        { "name": "UNIT - II (CPU Scheduling & Deadlocks)", "topics": ["Critical-Section Problem & Peterson's Solution", "Synchronization Hardware, Mutex, Semaphores", "Classic Problems of Synchronization", "Monitors & Synchronization Examples", "Scheduling Criteria & Algorithms", "Multi-Processor & Real-time Scheduling", "System Deadlock Model & Characterization", "Deadlock Prevention, Avoidance, Detection, and Recovery"] },
        { "name": "UNIT - III (Memory & Storage Management)", "topics": ["Background, Swapping, and Contiguous Allocation", "Segmentation and Paging", "Structure of the Page Table", "Demand Paging & Copy-on-Write", "Page Replacement Algorithms (FIFO, LRU)", "Allocation of Frames", "File Concept, Access Methods, Directories", "Directory & Disk Structure & Protection", "File-system Implementation & Allocation Methods", "Disk Scheduling Algorithms"] },
        { "name": "UNIT - IV (Linux Programming Basics)", "topics": ["Linux System Architecture", "Linux Command Format", "Internal and External Commands", "Directory Commands", "File-related Commands", "Disk-related Commands", "General Utilities"] }
      ]
    },
    {
      "subject": "Data Structures Lab",
      "isLab": true,
      "units": [
        { "name": "Programs", "topics": ["1. Array search using linear and binary search", "2. Sort list of numbers using Bubble Sort", "3. Perform Insertion and Selection Sort descending", "4. Singly linked list: insert, delete, display list", "5. Linear queue: insert, delete, display queue", "6. Circular queue using array implementation", "7. Ordered singly linked list operations", "8. Tower of Hanoi using recursion", "9. Recursive program to find GCD of 3 numbers", "10. Stack operations using linked list", "11. Infix to Postfix expression conversion", "12. Evaluate postfix expressions", "13. Binary tree: create, insert, delete, display", "14. Binary Search Tree (BST) traversals", "15. Heap Sort algorithm implementation", "16. String operations (length, concat, substring, replace)", "17. Adjacency matrix representation of graphs", "18. Hash table operations with open addressing"] }
      ]
    },
    {
      "subject": "Java Programming Lab",
      "isLab": true,
      "units": [
        { "name": "Programs", "topics": ["1. Hello World and show size of data types", "2. Demonstrate static, local, and global variables", "3. String operations (length, concat, substring)", "4. Find maximum of three numbers", "5. Check whether a number is odd or even", "6. Default and parameterized constructors", "7. Array of objects", "8. Single Inheritance", "9. Multiple Inheritance using Interface", "10. Applet Life Cycle and execution", "11. Division by zero exception handling", "12. Method Overloading for adding integers/floats", "13. Run-time Polymorphism", "14. Catch NegativeArraySizeException", "15. Null pointer exception & finally block", "16. Import user-defined packages", "17. Check if string is palindrome", "18. Factorial using command line argument", "19. Display all prime numbers between limits", "20. Create thread using Runnable Interface"] }
      ]
    },
    {
      "subject": "Linux & Shell Programming Lab",
      "isLab": true,
      "units": [
        { "name": "Shell Scripts & Linux Operations", "topics": ["1. Shell script to print primes between M and N", "2. Shell script to check palindrome of a number", "3. Shell script to find sum of digits of a number", "4. Shell script to implement 10 Linux commands", "5. Shell script to check file permissions", "6. Shell script to copy file within current folder", "7. Shell script to copy file between two folders", "8. Shell script to compare two data files", "9. Shell script to count vowels in a string", "10. Shell script to convert uppercase to lowercase", "11. Shell script to perform pattern matching", "12. Shell script to find factorial of a number", "13. Zombie process and orphan process simulation"] }
      ]
    }
  ],
  "Semester 3": [
    {
      "subject": "Database Management System",
      "units": [
        { "name": "UNIT – I (Database Fundamentals & Architecture)", "topics": ["Introduction to Data and Database", "History & Characteristics of DBMS", "Significance and Advantages of Database Approach", "Actors and Workers on/behind the Scene", "System Structure: Instance and Schema", "Data Models & Data Independence", "Three Schema Architecture", "Database Languages and Interfaces", "Centralized and Client-Server Architecture", "Classification of DBMS"] },
        { "name": "UNIT – II (Database Design & Storage)", "topics": ["High-Level Conceptual Data Models", "Entity Types, Sets, Attributes, and Keys", "Relationship Types, Sets, Roles, and Constraints", "Weak Entity Types & Extended ER Features", "Refining ER Design & Relational Mapping", "File Organization & Secondary Storage Devices", "File Organization Techniques", "Single-Level & Multi-Level Indexes"] },
        { "name": "UNIT – III (Relational Model, SQL & Normalization)", "topics": ["Relational Model Concepts & Constraints", "Relational Database Schema & Update Operations", "Dealing with Constraint Violations", "Anomalies in a Database & Functional Dependency", "Armstrong's Axioms & Closure", "Lossless Join and Dependency Preservation", "Normalization (1NF, 2NF, 3NF, BCNF)", "SQL Data Definition, Types, and Constraints", "Insert, Delete, and Update Statements", "Views, Assertions, and Triggers"] },
        { "name": "UNIT – IV (Query Processing, Transactions & PL/SQL)", "topics": ["Unary Relational Operations (SELECT, PROJECT)", "Binary Relational Operations (JOIN, DIVISION)", "Query Processing and Optimization", "Evaluation of Relational Algebra Expressions", "Introduction to Transaction Processing & ACID", "Concurrency Control & Two-Phase Locking", "Backup and Recovery from Failures", "Basics of PL/SQL Programming"] }
      ]
    },
    {
      "subject": "Python Programming",
      "units": [
        { "name": "UNIT – I (Foundations of Python)", "topics": ["Python Interpreter/Shell", "Identifiers, Keywords, Statements, Expressions", "Variables, Operators, Precedence, Associativity", "Data Types, Indentation, Comments", "Reading Input, Print Output, Type Conversions", "The type() function and 'is' operator", "Dynamic and Strongly Typed Language", "Control Flow: if, else, elif, nested if", "Looping: while, for, range, break, continue, pass", "Function Definition, Calling, Built-In, Return", "Default Parameters & Scope", "Command Line Arguments", "Strings: Creation, Operations, Slicing, Methods"] },
        { "name": "UNIT – II (Data Structures & Files)", "topics": ["Lists: Creation, Operations, Slicing, Methods", "The del Statement", "Dictionaries: Key-Value pairs, Methods", "Tuples: Creation, Operations, Slicing, Methods", "Sets & Frozensets: Creation, Operations, Methods", "Iterators and Iterables", "File Handling: Text and Binary files", "CSV File Handling", "Pickle Module"] },
        { "name": "UNIT – III (OOP & Data Handling Libraries)", "topics": ["Classes and Objects in Python", "Constructor Method & Multiple Objects", "Class vs Data Attributes", "Encapsulation, Inheritance, Polymorphism", "Introduction to NumPy (Arrays & Operations)", "Introduction to Pandas (Series & DataFrames)", "Indexing, Querying, Handling Missing Values", "Data Aggregation, Grouping, Summarization"] },
        { "name": "UNIT – IV (Data Analysis & Visualization)", "topics": ["Importing and Exporting Data (CSV, JSON)", "Understanding and Formatting Data", "Matplotlib & Plotly for Visualization", "Generating and Plotting Line/Bar Charts", "Random Walks & Dice Simulation", "Working with APIs & downloading data", "Visualizing Repositories & mapping datasets"] }
      ]
    },
    {
      "subject": "Computer Networks",
      "units": [
        { "name": "UNIT – I (Networking Principles)", "topics": ["Data Communications & Networks", "Network Types & Internet History", "Protocol Layering", "The OSI Model & TCP/IP Protocol Suite", "Introduction to Physical Layer", "Transmission Media & Impairments", "Data Rate Limits & Performance"] },
        { "name": "UNIT – II (Data Link Layer & MAC)", "topics": ["Link-Layer Addressing", "Error Detection/Correction (Block, Cyclic, Checksum)", "Data Link Control (HDLC, PPP)", "MAC Sublayer & Logical Link Control", "Random Access (ALOHA, CSMA, CSMA/CD, CSMA/CA)", "MAC Scheduling (Reservation, Polling, Token Passing)", "Channelization (FDMA, TDMA, CDMA)"] },
        { "name": "UNIT – III (Network Layer & Routing)", "topics": ["Network-Layer Services & Packet Switching", "Network-Layer Performance", "IPv4 Addressing & Network Layer Protocols", "Internet Protocol (IP) & ICMPv4", "Mobile IP", "Unicast Routing Algorithms & Protocols", "Next Generation IP: IPv6 Addressing"] },
        { "name": "UNIT – IV (Transport, Application & QoS)", "topics": ["Introduction to Transport-Layer Protocols", "User Datagram Protocol (UDP)", "TCP Services, Features, Connection, Congestion Control", "Flow Control & Error Control", "Application Layer: WWW, E-mail, DNS", "Quality of Service (QoS) & Flow Control"] }
      ]
    },
    {
      "subject": "Cyber Security",
      "units": [
        { "name": "UNIT – I (Cyber Security Basics & Cryptography)", "topics": ["Importance of Cyber Safety & Common Threats", "Viruses, Worms, Trojans, Phishing, Ransomware", "Goals of Cyber Security: CIA Triad", "Threats, Vulnerabilities, and Risks", "Firewall, Antivirus, Malware, Hacking concepts", "Safe Internet Practices & public Wi-Fi risks", "Intro to Cryptography & Symmetric/Asymmetric encryption", "Role of HTTPS/SSL, 2FA, OTP-based logins", "Importance of secure messaging and email"] },
        { "name": "UNIT – II (System & Device Security)", "topics": ["Operating System Security Basics", "User Authentication and Access Control", "Password Policies and Best Practices", "Antivirus and Anti-malware software", "Web and App Security (SQLi, XSS, CSRF)", "Mobile App Security (Permissions & safe usage)", "Safe use of devices, laptops, and social media", "Software updates & patch management", "Firewalls, VPNs, risks of cookies & tracking"] }
      ]
    },
    {
      "subject": "Database Management System Lab",
      "isLab": true,
      "units": [
        { "name": "Part A (SQL Queries)", "topics": ["1. Create table STUDENT: Insert, display, update, delete", "2. Create table COURSE: Alter and drop credit fields", "3. Employee tables: perform UNION, INTERSECT, MINUS", "4. Student table: perform aggregate & scalar functions", "5. Subqueries: above average marks & CSC department", "6. Join operations: display student names with depts", "7. View operations: student names and marks > 75", "8. Demonstrate GRANT & REVOKE and COMMIT/ROLLBACK"] },
        { "name": "Part B (PL/SQL blocks)", "topics": ["9. PL/SQL: check if number is even or odd", "10. PL/SQL: division and handle zero division", "11. PL/SQL: cursor display students by department", "12. PL/SQL: stored function grade calculation", "13. PL/SQL: stored procedure to update student marks", "14. PL/SQL: BEFORE INSERT trigger to prevent negative marks", "15. PL/SQL: trigger to log changes into STUDENT_LOG", "16. PL/SQL: cursor with loop to count department students"] }
      ]
    },
    {
      "subject": "Python Programming Lab",
      "isLab": true,
      "units": [
        { "name": "Part A (Python Basics)", "topics": ["1. Arithmetic operations and display results", "2. Check even/odd using if-else structures", "3. First n Fibonacci numbers using for loops", "4. Count vowels and consonants in a string", "5. Store and retrieve student details in dictionary", "6. Demonstrate break, continue, and pass statements", "7. NumPy array creation & element-wise operations", "8. Pandas Series indexing, slicing, and querying", "9. Pandas DataFrame sorting and filtering", "10. Handle missing values using mean/median"] },
        { "name": "Part B (Data & Stats)", "topics": ["11. Count word occurrences in a given string", "12. List operations (insert, delete, update)", "13. Employee details CRUD using dictionary", "14. Generate prime numbers using generator function", "15. Calculate factorial using recursive function", "16. Read/write student marks into a text file", "17. Plot line graph and bar chart using Matplotlib", "18. Load CSV file into Pandas and do basic analysis", "19. Group by category and calculate summary statistics", "20. Load dataset from Scikit-learn and show properties"] }
      ]
    },
    {
      "subject": "Computer Networks Lab",
      "isLab": true,
      "units": [
        { "name": "Programs", "topics": ["1. Execute commands: arp, ipconfig, hostname, netstat, ping", "2. Study of different types of network cables", "3. Crimping straight and cross-wired cables", "4. Network IP configuration static vs dynamic", "5. IP address configuration IPv4 and IPv6, subnet, supernet", "6. Study of Switch, Router, Bridge devices", "7. Configure and connect computer in LAN", "8. Block websites using Windows Defender Firewall", "9. Share folder in system and access via IP address", "10. Share printer in network and print", "11. Configure WiFi hotspot & connect other devices", "12. Configuration of switches", "13. Configuration of I/O box fixing", "14. Making your own patch cord", "15. Configuration of VLAN using Packet Tracer/GNS3", "16. Configuration of VPN using Packet Tracer/GNS3"] }
      ]
    }
  ],
  "Semester 4": [
    {
      "subject": "Artificial Intelligence",
      "units": [
        { "name": "UNIT – I (AI Fundamentals & Search)", "topics": ["Definitions, Applications, and Scope of AI", "Intelligent Agents & Environments", "Concept of Rationality & Agent Structure", "Knowledge-Based Agents & Wumpus World", "Problem Solving Agents & Formulation", "Uninformed Search (DFS, BFS, Iterative Deepening)", "Informed Search (Best-First, A*, AO*, Means-End)", "Adversarial Search: Minimax & Alpha-Beta Pruning"] },
        { "name": "UNIT – II (Knowledge & Learning)", "topics": ["Propositional Logic & First-Order Predicate Logic", "Inference Techniques (Unification, Chaining, Resolution)", "Truth Maintenance Systems", "Constraint Satisfaction Problems (CSPs)", "Backtracking Search", "Learning Concepts (Rote, Advice, Problem Solving)", "Learning from Examples & Decision Trees"] },
        { "name": "UNIT – III (Planning & Perception)", "topics": ["Introduction to Planning & State-Space Search", "Blocks World Problem & STRIPS Representation", "Handling Uncertainty (Non-Monotonic & Probabilistic)", "Fuzzy Logic & Fuzzy Set Theory", "Computer Vision: Classification & Object Detection", "NLP: Syntactic, Semantic, and Pragmatic Processing"] },
        { "name": "UNIT – IV (Machine Learning & AI Ethics)", "topics": ["Supervised, Unsupervised, and Reinforcement Learning", "Basics of Artificial Neural Networks (ANN)", "Deep Learning Concepts (CNN, RNN, LSTM)", "Expert Systems Architecture & Case Studies", "Legal and Ethical Issues in AI (Societal Impact, Privacy)"] }
      ]
    },
    {
      "subject": "Design and Analysis of Algorithms",
      "units": [
        { "name": "UNIT – I (Algorithm Design Foundations)", "topics": ["Introduction to Algorithms & Problem Solving", "Important Problem Types & Data Structures", "Analysis of Algorithm Efficiency Framework", "Asymptotic Notations & Basic Efficiency Classes", "Mathematical Analysis of Recursive/Non-recursive", "Empirical Analysis of Algorithms"] },
        { "name": "UNIT – II (Algorithm Design Techniques)", "topics": ["Brute Force (Selection Sort, Bubble Sort, Sequential Search)", "Brute-Force String Matching", "DFS and BFS Search Techniques", "Decrease and Conquer (Insertion Sort, Topological Sorting)", "Combinatorial Object Generation", "Decrease-by-a-Constant-Factor Algorithms", "Divide and Conquer (Merge Sort, Quick Sort)", "Binary Tree Traversals & Properties"] },
        { "name": "UNIT – III (Optimization Techniques)", "topics": ["Space and Time Tradeoffs (Sorting by Counting)", "Input Enhancement in String Matching & Hashing", "Dynamic Programming & Principle of Optimality", "Optimal BST, Knapsack Problem & Memory Functions", "Warshall's and Floyd's Algorithms", "Greedy Technique (Prim's, Kruskal's, Dijkstra's)", "Huffman Trees"] },
        { "name": "UNIT – IV (Complexity & Problem-Solving)", "topics": ["Limitations of Algorithm Power & Lower Bounds", "Decision Trees, P, NP, and NP-Complete Problems", "Backtracking (4-Queens, Hamiltonian Circuit, Sum of Subsets)", "Branch-and-Bound (Assignment, Knapsack, TSP)"] }
      ]
    },
    {
      "subject": "Internet Technologies",
      "units": [
        { "name": "UNIT – I (Internet & Cyber Ethics)", "topics": ["INTERconnected NETwork & Giant WAN", "Communicating over & Accessing the Internet", "Internet Organisations & Cyber Ethics", "Internet Services, E-Mail, File Transfer", "Real-Time User Communication & Remote Login", "WWW Introduction & Working Web", "Web Terminology, Architecture, Challenges"] },
        { "name": "UNIT – II (Web Technologies & Evolution)", "topics": ["HTTP Version, connections, & Communication", "HTTPS & HTTP State Retention (Cookies)", "HTTP Cache & Evolution of Web (Web 1.0, 2.0, 3.0)", "Web Information Retrieval (Web IR) Tools", "Search Engine Architecture", "Web Information Retrieval Metrics & Models"] },
        { "name": "UNIT – III (Web Development & Client/Server)", "topics": ["Basics and Elements of Web Development", "Client-Side and Server-Side Scripting basics", "Model-View-Controller (MVC) Architecture", "HTML, CSS, JavaScript basics", "Bootstrap Framework & AngularJS Framework", "Server-Side Scripting & Node.js"] },
        { "name": "UNIT – IV (Frameworks & Databases)", "topics": ["Web Application Frameworks (Django, Ruby on Rails)", "Structured Query Language (SQL) & Relational DBs", "Web Databases: NoSQL, Non-relational, Distributed", "Contextual Information Retrieval & Web Mining"] }
      ]
    },
    {
      "subject": "Ethical Hacking",
      "units": [
        { "name": "UNIT – I (Ethical Hacking Foundations)", "topics": ["Definition and Scope of Ethical Hacking", "Hacking vs Ethical Hacking & Hacker Types", "Ethical Hacking Process & Phases", "Common Attack Types (Phishing, Malware, Password cracking)", "Social Engineering attacks (phishing, baiting, shoulder surfing)", "Intro to Trojans, worms, viruses, and ransomware", "Basics of keyloggers, spyware, backdoors, and rootkits", "Sniffing and packet capturing", "Role of ethical hacking & prevention strategies"] },
        { "name": "UNIT – II (Footprinting & System Exploitation)", "topics": ["Reconnaissance and Information Gathering", "Footprinting (Search engines, Social networks, WHOIS, DNS)", "Tools for passive and active footprinting", "Scanning Networks (IP, Port, Vulnerability scanning)", "Nmap & Angry IP Scanner overview", "Windows and Linux Enumeration (Users, Shares, Ports)", "Password cracking & Privilege escalation", "Keylogging & Unauthorized access techniques"] }
      ]
    },
    {
      "subject": "Probability and Statistics",
      "units": [
        { "name": "UNIT – I (Probability Foundations)", "topics": ["Basic concepts of Probability & trial/outcomes", "Sample Space, Events, and Mutually Exclusive Events", "Conditional Probability & Independent Events", "Addition and Multiplication Theorems of Probability", "Bayes' Theorem Statement & Applications"] },
        { "name": "UNIT – II (Random Variables & Distributions)", "topics": ["Definition of Discrete & Continuous Random Variables", "Probability Mass Function (PMF) & Probability Density Function (PDF)", "Distribution Function & its Properties", "Mean and Variance calculation for PMF/PDF", "Mathematical Expectation of random variables"] }
      ]
    },
    {
      "subject": "Artificial Intelligence Lab",
      "isLab": true,
      "units": [
        { "name": "Programs", "topics": ["1. BFS on simple grid demonstration", "2. DFS on a small graph", "3. Solve Water Jug Problem using BFS", "4. Hill Climbing search for peak detection", "5. A* Search algorithm on 4x4 grid", "6. Minimax search algorithm for 2-player game", "7. Constraint propagation for Magic Square", "8. Optimization algorithm to find max value", "9. Represent/evaluate propositional logic expressions", "10. Rule-based expert system for weather classification", "11. Simple AI agent decision-making rules", "12. Rule-based chatbot", "13. NLTK tasks (Tokenize, Stem, Stop words, POS, NER)"] }
      ]
    },
    {
      "subject": "Design & Analysis of Algorithms Lab",
      "isLab": true,
      "units": [
        { "name": "Programs", "topics": ["1. Linear search time complexity graph plotting", "2. Binary search time complexity graph plotting", "3. Solve Towers of Hanoi problem", "4. Selection sort time complexity graph plotting", "5. Find min/max in array using Divide & Conquer", "6. Quick sort time complexity graph plotting", "7. Dynamic programming for optimal binary search tree", "8. Floyd's algorithm for shortest paths", "9. Boyer-Moore string matching", "10. BFS traversal implementation", "11. Prim's algorithm for Minimum Spanning Tree", "12. Kruskal's algorithm for Minimum Spanning Tree", "13. Topological ordering & Warshall's transitive closure", "14. Backtracking for 4-queens problem", "15. Find subset sum equal to positive integer d"] }
      ]
    },
    {
      "subject": "Internet Technologies Lab",
      "isLab": true,
      "units": [
        { "name": "Programs", "topics": ["1. Demonstrate E-Mail working (Send, Receive, Forward)", "2. Create/organize Zoom or GoogleMeet", "3. Create HTML form with various input tags", "4. HTML page with basic tags (hyperlink, marquee, image)", "5. HTML page with multiple stylesheets", "6. Write CGI sample program", "7. Create Time-Table using table tag", "8. Create frames in browser window using HTML", "9. JS dialogue boxes (alert, confirm, prompt)", "10. Form validations using JavaScript", "11. JS program to perform arithmetic operations", "12. Create web site of your college"] }
      ]
    }
  ],
  "Semester 5": [
    {
      "subject": "Web Programming",
      "units": [{ "name": "Full Stack Backend", "topics": ["Node.js runtime", "Express framework", "MongoDB CRUD operations", "RESTful API architecture"] }]
    },
    {
      "subject": "Data Analytics",
      "units": [{ "name": "Data Processing & Stats", "topics": ["Data cleaning pipelines", "Descriptive & Inferential stats", "Linear Regression math", "Data visualization"] }]
    },
    {
      "subject": "Software Engineering",
      "units": [{ "name": "Software Engineering Principles", "topics": ["SDLC Models", "Requirements Gathering", "Software Design Patterns", "Agile Methodologies"] }]
    },
    {
      "subject": "Operations Research",
      "units": [{ "name": "Optimization Models", "topics": ["Linear Programming Problems (LPP)", "Simplex Method", "Transportation Models", "Assignment Problems"] }]
    }
  ],
  "Semester 6": [
    {
      "subject": "Machine Learning",
      "units": [{ "name": "ML Models & Metrics", "topics": ["Supervised vs Unsupervised", "Support Vector Machines (SVM)", "KNN Classification numericals", "Confusion Matrix (Precision/Recall)"] }]
    },
    {
      "subject": "Cloud Computing",
      "units": [{ "name": "Cloud Infrastructure", "topics": ["SaaS, PaaS, IaaS Models", "Virtualization Technologies", "Cloud Security", "AWS/Azure Deployments"] }]
    },
    {
      "subject": "Data Mining",
      "units": [{ "name": "Knowledge Discovery", "topics": ["Data Warehousing basics", "Apriori Association Rules", "Clustering Algorithms (K-means)", "Decision Tree induction"] }]
    },
    {
      "subject": "Theory of Computation",
      "units": [{ "name": "Automata & Grammars", "topics": ["DFA & NFA conversions", "Regular Expressions", "Context-Free Grammars (CFG)", "Turing Machines"] }]
    }
  ]
};

const romans = ["I", "II", "III", "IV", "V", "VI"];

export const syllabus: Semester[] = Array.from({ length: 6 }, (_, semIdx) => {
  const num = semIdx + 1;
  const semKey = `Semester ${num}` as keyof typeof rawSyllabus;
  const rawSubjects = rawSyllabus[semKey] || [];

  return {
    id: `sem${num}`,
    number: num,
    title: `Semester ${romans[semIdx]}`,
    subjects: rawSubjects.map((s, subIdx) => {
      // Determine code
      const isLab = "isLab" in s && s.isLab;
      const code = isLab 
        ? `24BCA${num}${subIdx + 1}P`
        : `24BCA${num}${subIdx + 1}`;
      const slug = code.toLowerCase();

      return {
        id: slug,
        title: s.subject,
        code,
        chapters: s.units.map((unit, chIdx) => {
          const chId = `${slug}-ch${chIdx + 1}`;
          return {
            id: chId,
            title: unit.name,
            topics: unit.topics.map((topicName, tIdx) => {
              const tId = `${chId}-t${tIdx + 1}`;
              return {
                id: tId,
                title: topicName,
                content: `This section covers ${topicName} as part of the Bengaluru City University BCA syllabus for ${s.subject}. Students will study the core theoretical principles, structural characteristics, and practical applications related to this topic.`,
              };
            }),
          };
        }),
      };
    }),
  };
});

export const findSemester = (id: string) => syllabus.find((s) => s.id === id);
export const findSubject = (semId: string, subId: string) =>
  findSemester(semId)?.subjects.find((s) => s.id === subId);
export const findChapter = (semId: string, subId: string, chId: string) =>
  findSubject(semId, subId)?.chapters.find((c) => c.id === chId);
export const findTopic = (semId: string, subId: string, chId: string, tId: string) =>
  findChapter(semId, subId, chId)?.topics.find((t) => t.id === tId);
