import type { AgendaItem, PadletCard, StudentCarmenProfile, UnitTaskItem, AIReadinessAssessment } from "./types";

export const MOCK_CARMEN_STUDENTS: Record<string, StudentCarmenProfile> = {
  "11111111-1111-4111-8111-111111111111": {
    studentId: "11111111-1111-4111-8111-111111111111",
    name: "Alex Morgan",
    buckeyeIdDisplay: "morgan.1842",
    major: "Computer Science & Engineering",
    syncStatus: "connected",
    lastSynced: "Just now · CarmenCanvas OAuth 2.0",
    courses: [
      {
        courseId: "cse-2221",
        courseCode: "CSE 2221",
        courseName: "Software I: Software Components",
        instructor: "Dr. Bucci",
        currentGrade: "91.8% (A)",
        nextAssignment: {
          id: "hw-06",
          title: "Homework 6: Recursion & Tree Tracing",
          dueDate: "Tomorrow at 11:59 PM",
          points: 20,
          submitted: false,
        },
        flaggedTopic: "Recursive call stack termination (Quiz 4 score: 75%)",
        recentQuizInsight: "Missed base case boundary condition in test-case #3.",
      },
      {
        courseId: "math-1151",
        courseCode: "MATH 1151",
        courseName: "Calculus I",
        instructor: "Prof. Baker",
        currentGrade: "87.4% (B+)",
        nextAssignment: {
          id: "math-hw-08",
          title: "Carmen Online Homework 8: Optimization",
          dueDate: "Friday at 11:59 PM",
          points: 50,
          submitted: false,
        },
        flaggedTopic: "Global vs Local extrema on closed intervals",
        recentQuizInsight: "Review Extreme Value Theorem endpoints.",
      },
    ],
    individualRecommendations: [
      {
        id: "rec-alex-1",
        topic: "Recursion Base Case Guarding",
        priority: "high",
        reason: "Canvas Quiz 4 flagged missed base cases when n = 0.",
        actionItem: "Verify in your group notes that recursive methods check the base condition before reducing inputs.",
        carmenCourseCode: "CSE 2221",
        sourceContext: "Based on Canvas Quiz 4: Recursion Tracing",
      },
      {
        id: "rec-alex-2",
        topic: "Queue1L Recursive Reversal",
        priority: "medium",
        reason: "Homework 6 problem 2 requires reversing a Queue using only dequeue/enqueue and recursion.",
        actionItem: "Ask Jordan in your group to trace the implicit call stack with you.",
        carmenCourseCode: "CSE 2221",
        sourceContext: "Homework 6 due tomorrow at 11:59 PM",
      },
    ],
  },
  "22222222-2222-4222-8222-222222222222": {
    studentId: "22222222-2222-4222-8222-222222222222",
    name: "Jordan Lee",
    buckeyeIdDisplay: "lee.9041",
    major: "Mathematics",
    syncStatus: "connected",
    lastSynced: "5 mins ago · CarmenCanvas OAuth 2.0",
    courses: [
      {
        courseId: "math-1151",
        courseCode: "MATH 1151",
        courseName: "Calculus I",
        instructor: "Prof. Baker",
        currentGrade: "96.2% (A)",
        nextAssignment: {
          id: "math-wr-08",
          title: "Written Homework 8: Related Rates",
          dueDate: "Friday at 5:00 PM",
          points: 30,
          submitted: true,
          score: "Pending Grading",
        },
        flaggedTopic: "Geometric rate of change setups (conical tanks)",
        recentQuizInsight: "Excellent derivative work; strengthen word-problem geometric diagrams.",
      },
      {
        courseId: "stat-3470",
        courseCode: "STAT 3470",
        courseName: "Introduction to Probability and Statistics",
        instructor: "Dr. Huang",
        currentGrade: "90.0% (A-)",
        nextAssignment: {
          id: "stat-lab-03",
          title: "Lab 3: Poisson Processes",
          dueDate: "Monday at 11:59 PM",
          points: 40,
          submitted: false,
        },
        flaggedTopic: "Exponential distribution memoryless property",
        recentQuizInsight: "Review P(X > s + t | X > s) proofs.",
      },
    ],
    individualRecommendations: [
      {
        id: "rec-jordan-1",
        topic: "Geometric Modeling in Related Rates",
        priority: "high",
        reason: "Canvas Midterm 1 noted slight point deductions on 3D geometric constraints.",
        actionItem: "Sketch the changing height and radius equation r/h before taking d/dt.",
        carmenCourseCode: "MATH 1151",
        sourceContext: "Canvas Homework 8 written feedback",
      },
      {
        id: "rec-jordan-2",
        topic: "Peer Explanation: Recursion vs Recurrence Relations",
        priority: "low",
        reason: "Alex in your group is reviewing CSE 2221 recursion; you can relate it to mathematical induction.",
        actionItem: "Show how recurrence relations match the recursive call trees in their notes.",
        carmenCourseCode: "MATH 1151",
        sourceContext: "Cross-course synergy suggestion",
      },
    ],
  },
  "33333333-3333-4333-8333-333333333333": {
    studentId: "33333333-3333-4333-8333-333333333333",
    name: "Sam Patel",
    buckeyeIdDisplay: "patel.4110",
    major: "Computer Science & Engineering",
    syncStatus: "connected",
    lastSynced: "12 mins ago · CarmenCanvas OAuth 2.0",
    courses: [
      {
        courseId: "cse-2221",
        courseCode: "CSE 2221",
        courseName: "Software I: Software Components",
        instructor: "Dr. Bucci",
        currentGrade: "88.5% (B+)",
        nextAssignment: {
          id: "hw-06",
          title: "Homework 6: Recursion & Tree Tracing",
          dueDate: "Tomorrow at 11:59 PM",
          points: 20,
          submitted: false,
        },
        flaggedTopic: "Mathematical Induction correspondence with recursion",
        recentQuizInsight: "Great trace on factorial; practice on nested call structures.",
      },
      {
        courseId: "cse-2321",
        courseCode: "CSE 2321",
        courseName: "Foundations I: Discrete Structures",
        instructor: "Prof. Supowit",
        currentGrade: "85.2% (B)",
        nextAssignment: {
          id: "cse-lab-04",
          title: "Homework 5: Strong Induction",
          dueDate: "Sunday at 11:59 PM",
          points: 50,
          submitted: false,
        },
        flaggedTopic: "Inductive hypothesis formulation for trees",
        recentQuizInsight: "State induction hypothesis explicitly for all k < n.",
      },
    ],
    individualRecommendations: [
      {
        id: "rec-sam-1",
        topic: "Strong Induction on Tree Structures",
        priority: "high",
        reason: "Canvas Homework 5 focuses on proving bounds for binary trees.",
        actionItem: "Work through the tree height lemma while Alex and Jordan review recursion.",
        carmenCourseCode: "CSE 2321",
        sourceContext: "Carmen Module 4: Inductive Proofs",
      },
    ],
  },
};

export const INITIAL_UNIT_TASKS: UnitTaskItem[] = [
  {
    id: "task-1",
    title: "Base Case Guards: Verify n <= 0 and empty queue conditions",
    category: "concept",
    completed: true,
    assignedTo: "Alex Morgan",
    weight: 20,
    carmenTopicRef: "Canvas Quiz 4: Base Case Termination",
    color: "scarlet",
  },
  {
    id: "task-2",
    title: "Call Stack Tracing: Step through recursion frames for factorial(3)",
    category: "concept",
    completed: true,
    assignedTo: "Jordan Lee",
    weight: 20,
    carmenTopicRef: "Lecture 8: Activation Records & Call Stacks",
    color: "cream",
  },
  {
    id: "task-3",
    title: "Queue Reversal: Implement recursive reversal without loops or arrays",
    category: "code",
    completed: true,
    assignedTo: "Sam Patel",
    weight: 25,
    carmenTopicRef: "Homework 6: Problem 2 (Due Tomorrow)",
    color: "sage",
  },
  {
    id: "task-4",
    title: "Carmen Quiz 4 Trap: Restore mutated queue state on return",
    category: "gotcha",
    completed: false,
    assignedTo: "Alex Morgan",
    weight: 20,
    carmenTopicRef: "Canvas Quiz 4: State Mutation Traps",
    color: "amber",
  },
  {
    id: "task-5",
    title: "Recurrence Relation: Formulate T(n) = T(n-1) + O(1) runtime",
    category: "practice",
    completed: false,
    assignedTo: "Jordan Lee",
    weight: 15,
    carmenTopicRef: "Midterm 2 Practice Exam: Problem 4",
    color: "cream",
  },
];

export function calculateReadiness(
  tasks: UnitTaskItem[],
  toggledItem?: UnitTaskItem
): AIReadinessAssessment {
  const completedTasks = tasks.filter((t) => t.completed);
  const totalScore = completedTasks.reduce((sum, t) => sum + t.weight, 0);

  let statusLabel: AIReadinessAssessment["statusLabel"] = "Needs Practice";
  if (totalScore >= 90) statusLabel = "Exam Ready";
  else if (totalScore >= 70) statusLabel = "Proficient";
  else if (totalScore >= 40) statusLabel = "Developing";

  let aiResponse = "";
  let recommendedNextAction = "";

  if (totalScore === 100) {
    aiResponse =
      "🏆 Outstanding! 100% Unit Mastery reached! Your group has verified every core competency for CSE 2221 Recursion against Dr. Bucci's syllabus. Estimated exam readiness: Grade A.";
    recommendedNextAction = "Review formula sheets or assist other tables on Thompson Floor 3.";
  } else if (toggledItem) {
    if (toggledItem.completed) {
      if (toggledItem.id === "task-4") {
        aiResponse =
          "🎯 Carmen AI Analysis: Excellent catch! Mastering state restoration for Queue1L eliminates the #1 mistake on Canvas Quiz 4. Group readiness jumped to " +
          totalScore +
          "%.";
        recommendedNextAction = "Complete the recurrence relation runtime to finish the unit.";
      } else if (toggledItem.id === "task-5") {
        aiResponse =
          "📈 Carmen AI Analysis: Great work! Deriving the recursive runtime T(n) verifies your asymptotic analysis. Readiness is now " +
          totalScore +
          "% (" +
          statusLabel +
          ").";
        recommendedNextAction = "Review the caller state mutation trap to hit 100%.";
      } else {
        aiResponse =
          "✨ Carmen AI Analysis: Milestone completed! Group readiness increased to " +
          totalScore +
          "% (" +
          statusLabel +
          "). Your table is progressing 24% faster than average OSU study groups.";
        recommendedNextAction = "Tackle the remaining unit objectives below.";
      }
    } else {
      aiResponse =
        "🔄 Carmen AI Analysis: Milestone reopened. Readiness adjusted to " +
        totalScore +
        "% (" +
        statusLabel +
        "). Spend a few more minutes reviewing this concept together.";
      recommendedNextAction = "Trace an additional edge case to confirm confidence.";
    }
  } else {
    aiResponse =
      "Carmen AI Readiness: Group is currently at " +
      totalScore +
      "% unit completion (" +
      statusLabel +
      "). Check off completed topics as you review them to track your exam readiness.";
    recommendedNextAction = "Work through the unchecked sticky tasks with your table partners.";
  }

  return {
    readinessScore: totalScore,
    statusLabel,
    aiResponse,
    recommendedNextAction,
    lastUpdatedMilestone: toggledItem?.title,
  };
}

export const INITIAL_PADLET_CARDS: PadletCard[] = [
  {
    id: "card-1",
    category: "concept",
    title: "Base Case Golden Rule",
    content: "Always check the simplest possible instance first (e.g. n == 0 or empty list). If missed, you hit StackOverflowError!",
    authorName: "Alex Morgan",
    authorId: "11111111-1111-4111-8111-111111111111",
    createdAt: "22 mins ago",
    votes: 4,
    color: "scarlet",
  },
  {
    id: "card-2",
    category: "gotcha",
    title: "Carmen Quiz 4 Trap: Mutating State",
    content: "When passing objects in Java (like NaturalNumber or Queue), remember dequeue changes the caller's reference unless restored in post-recursion step!",
    authorName: "Sam Patel",
    authorId: "33333333-3333-4333-8333-333333333333",
    createdAt: "15 mins ago",
    votes: 6,
    color: "amber",
  },
  {
    id: "card-3",
    category: "code",
    title: "Queue Reversal Pattern",
    content: "```java\nvoid reverse(Queue<Integer> q) {\n  if (q.length() == 0) return;\n  int x = q.dequeue();\n  reverse(q);\n  q.enqueue(x);\n}\n```",
    authorName: "Jordan Lee",
    authorId: "22222222-2222-4222-8222-222222222222",
    createdAt: "9 mins ago",
    votes: 5,
    color: "sage",
  },
  {
    id: "card-4",
    category: "question",
    title: "Exam Question: Recursion vs Iteration Space",
    content: "Does Java do Tail Call Optimization (TCO)? Dr. Bucci mentioned JVM does NOT optimize tail recursion, so stack depth is still O(N). Can someone verify?",
    authorName: "Alex Morgan",
    authorId: "11111111-1111-4111-8111-111111111111",
    createdAt: "3 mins ago",
    votes: 2,
    color: "cream",
  },
];

export const INITIAL_AGENDA_ITEMS: AgendaItem[] = [
  {
    id: "agenda-1",
    title: "Review base cases & stack tracing template",
    completed: true,
    assignedToName: "Alex Morgan",
    estimatedMinutes: 15,
    addedByName: "Alex Morgan",
  },
  {
    id: "agenda-2",
    title: "Solve Carmen Quiz 4 recursion problem #2 together",
    completed: true,
    assignedToName: "Sam Patel",
    estimatedMinutes: 20,
    addedByName: "Sam Patel",
  },
  {
    id: "agenda-3",
    title: "Implement Queue recursive reversal (HW 6)",
    completed: true,
    assignedToName: "Jordan Lee",
    estimatedMinutes: 25,
    addedByName: "Jordan Lee",
  },
  {
    id: "agenda-4",
    title: "Compare recurrence relation runtime T(n) = 2T(n/2) + O(n)",
    completed: false,
    assignedToName: "Jordan Lee",
    estimatedMinutes: 15,
    addedByName: "Jordan Lee",
  },
  {
    id: "agenda-5",
    title: "Draft 1-page formula sheet for Midterm 2",
    completed: false,
    assignedToName: "All Members",
    estimatedMinutes: 20,
    addedByName: "Alex Morgan",
  },
];

export const INITIAL_CHAT_MESSAGES = (studentName: string, courseCode: string) => [
  {
    id: "msg-welcome",
    sender: "carmen_ai" as const,
    text: `Hi ${studentName}! I'm your Carmen AI study assistant. I've synced your CarmenCanvas course records for ${courseCode} and analyzed your group's active notes on Thompson Library Floor 3. Ask me anything, or tap a suggestion below!`,
    timestamp: "Just now",
    carmenSourceBadge: "CarmenCanvas API v1 · OSU Verified",
  },
];
