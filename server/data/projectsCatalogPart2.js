/**
 * MASTERY ZONE — REAL-WORLD PORTFOLIO PROJECTS CATALOG (PART 2: PROJECTS 8 - 14)
 * Every project has multi-file starter code, multi-file reference implementation,
 * unique functional & technical requirements, structured tasks, 100-mark rubric,
 * and 6 deterministic automated test cases (4 visible + 2 hidden edge cases).
 */

const PROJECTS_PART_2 = [
  // =========================================================================
  // 8. NEW PROJECT 4: Online Examination & Assessment System
  // =========================================================================
  {
    id: "proj_online_exam",
    title: "Online Examination & Assessment System",
    category: "Full-Stack & Web",
    track: "Python / FastAPI",
    level: "Intermediate",
    difficulty: "Intermediate",
    starterLanguage: "python",
    technologies: ["React", "FastAPI", "PostgreSQL", "Automated Grading"],
    estimatedTime: "5 Hours",
    xpReward: 450,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Build an Online Examination & Assessment System supporting question bank management, server-enforced exam timer deadlines, automated answer-key grading, and tamper-proof result report generation.",
    problemStatement:
      "Digital examination platforms must prevent client-side answer exposure, enforce strict time limits (auto-rejecting late submissions beyond grace window), score candidate answers deterministically against weighted question banks, and generate detailed grade reports.",
    realWorldScenario:
      "You are building the FastAPI examination grading engine and PostgreSQL question bank manager for an online accreditation system.",
    objectives: [
      "Manage a weighted question bank and sanitize public questions (hiding `answer` keys) in `question_bank.py`.",
      "Validate exam timer limits (`duration_sec <= time_limit_sec`) in `grading_engine.py`.",
      "Evaluate candidate answers, compute `marks_obtained`, `percentage`, `grade`, and `passed` (`>= 80%`).",
      "Support instructor question creation with strict answer-index validation.",
    ],
    ioSpecification: {
      inputFormat: "JSON request on stdin: { action: 'fetch_exam' | 'submit_exam' | 'add_question', payload: {...} }",
      outputFormat: "JSON response with sanitized exam paper, graded scorecard report, or newly added question.",
    },
    deliverables: [
      "Question bank & answer-key sanitizer (question_bank.py)",
      "Timed exam evaluator & report generator (grading_engine.py)",
      "FastAPI-style request router (main.py)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_ex_1", title: "Sanitized Exam Paper Delivery", description: "Return questions with id, prompt, options, and marks while stripping the secret correctIndex.", mandatory: true, validationPatterns: ["get_public_questions", "options", "marks"] },
      { id: "fr_ex_2", title: "Server-Side Time Limit Enforcement", description: "Reject exam submissions where timeTakenSec > timeLimitSec with TIME_LIMIT_EXCEEDED.", mandatory: true, validationPatterns: ["TIME_LIMIT_EXCEEDED", "time_limit"] },
      { id: "fr_ex_3", title: "Automated Weighted Grading & Report", description: "Score answers against question bank, computing marksObtained, totalMarks, percentage, and passed (>=80%).", mandatory: true, validationPatterns: ["grade_submission", "marksObtained", "percentage", "passed"] },
      { id: "fr_ex_4", title: "Question Bank Validation", description: "Validate new questions have >= 2 options and valid correctIndex bounds.", mandatory: true, validationPatterns: ["add_question", "INVALID_QUESTION"] },
    ],
    technicalRequirements: [
      { id: "tr_ex_1", title: "Multi-File Python Separation", constraint: "Separate question repository (question_bank.py), grading logic (grading_engine.py), and router (main.py).", mandatory: true, validationPatterns: ["from question_bank import", "from grading_engine import"] },
      { id: "tr_ex_2", title: "Answer Key Security", constraint: "Never expose correctIndex in fetch_exam output.", mandatory: true, validationPatterns: ["get_public_questions"] },
      { id: "tr_ex_3", title: "Deterministic Grade Mapping", constraint: "Assign A+ (>=90), A (>=80), B (>=70), F (<70).", mandatory: true, validationPatterns: ["A+", "passed"] },
    ],
    milestones: [
      {
        id: "task_ex_1",
        stepNumber: 1,
        title: "Implement Question Bank & Answer-Key Sanitizer",
        question: "Implement `get_public_questions()` and `add_question(q)` in `question_bank.py`.",
        expectedFunctionality: "Strips `correctIndex` when serving exam papers to candidates and validates new questions.",
        technicalConstraints: "Reject questions with `< 2` options or out-of-range `correctIndex`.",
        acceptanceCriteria: "`fetch_exam` returns 3 questions totaling 10 marks with no `correctIndex` field.",
        marksAllocated: 30,
        targetFile: "question_bank.py",
        validationPatterns: ["def get_public_questions", "def add_question", "INVALID_QUESTION"],
      },
      {
        id: "task_ex_2",
        stepNumber: 2,
        title: "Build Timed Exam Grading Engine",
        question: "Implement `grade_submission(answers, time_taken_sec, time_limit_sec)` in `grading_engine.py`.",
        expectedFunctionality: "Verifies timer compliance, awards marks per correct answer, and generates scorecard.",
        technicalConstraints: "Return `TIME_LIMIT_EXCEEDED` if `time_taken_sec > time_limit_sec`.",
        acceptanceCriteria: "Candidate answering all 3 correctly within 600s receives `10/10` (`100%`, Grade `A+`, `passed: True`).",
        marksAllocated: 40,
        targetFile: "grading_engine.py",
        validationPatterns: ["def grade_submission", "TIME_LIMIT_EXCEEDED", "marksObtained"],
      },
      {
        id: "task_ex_3",
        stepNumber: 3,
        title: "Wire Exam Controller in main.py",
        question: "Connect `question_bank.py` and `grading_engine.py` in `main.py`.",
        expectedFunctionality: "Dispatches `fetch_exam`, `submit_exam`, and `add_question` actions.",
        technicalConstraints: "Output valid JSON on stdout.",
        acceptanceCriteria: "All 6 automated online examination test cases pass.",
        marksAllocated: 30,
        targetFile: "main.py",
        validationPatterns: ["get_public_questions", "grade_submission", "json.dumps"],
      },
    ],
    files: [
      {
        name: "main.py",
        language: "python",
        content: `import sys
import json
from question_bank import get_public_questions, add_question
from grading_engine import grade_submission

# TODO: Route 'fetch_exam', 'submit_exam', and 'add_question'
print(json.dumps({"ok": False, "error": "Online exam engine not implemented"}))
`,
      },
      {
        name: "question_bank.py",
        language: "python",
        content: `QUESTIONS = [
    {"id": "q1", "prompt": "HTTP status for Created?", "options": ["200", "201", "204"], "correctIndex": 1, "marks": 3},
    {"id": "q2", "prompt": "PostgreSQL ACID property I stands for?", "options": ["Indexing", "Isolation", "Integrity"], "correctIndex": 1, "marks": 3},
    {"id": "q3", "prompt": "Time complexity of binary search?", "options": ["O(n)", "O(log n)", "O(1)"], "correctIndex": 1, "marks": 4}
]

def get_public_questions():
    # TODO: Return questions WITHOUT 'correctIndex'
    return []

def add_question(payload):
    # TODO: Validate and append question
    return {"ok": False}
`,
      },
      {
        name: "grading_engine.py",
        language: "python",
        content: `from question_bank import QUESTIONS

def grade_submission(answers, time_taken_sec, time_limit_sec=600):
    # TODO: Validate time limit and compute marksObtained, totalMarks, percentage, grade, passed
    return {"ok": False}
`,
      },
    ],
    solutionFiles: [
      {
        name: "main.py",
        language: "python",
        content: `import sys
import json
from question_bank import get_public_questions, add_question
from grading_engine import grade_submission

def main():
    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"ok": False, "error": "EMPTY_INPUT"}))
        return
    req = json.loads(raw)
    action = req.get("action", "")
    payload = req.get("payload", {})

    if action == "fetch_exam":
        qs = get_public_questions()
        print(json.dumps({"ok": True, "count": len(qs), "questions": qs}))
    elif action == "submit_exam":
        res = grade_submission(
            payload.get("answers", {}),
            payload.get("timeTakenSec", 0),
            payload.get("timeLimitSec", 600)
        )
        print(json.dumps(res))
    elif action == "add_question":
        print(json.dumps(add_question(payload)))
    else:
        print(json.dumps({"ok": False, "error": "UNKNOWN_ACTION"}))

if __name__ == "__main__":
    main()
`,
      },
      {
        name: "question_bank.py",
        language: "python",
        content: `QUESTIONS = [
    {"id": "q1", "prompt": "HTTP status for Created?", "options": ["200", "201", "204"], "correctIndex": 1, "marks": 3},
    {"id": "q2", "prompt": "PostgreSQL ACID property I stands for?", "options": ["Indexing", "Isolation", "Integrity"], "correctIndex": 1, "marks": 3},
    {"id": "q3", "prompt": "Time complexity of binary search?", "options": ["O(n)", "O(log n)", "O(1)"], "correctIndex": 1, "marks": 4}
]

def get_public_questions():
    return [
        {"id": q["id"], "prompt": q["prompt"], "options": q["options"], "marks": q["marks"]}
        for q in QUESTIONS
    ]

def add_question(payload):
    prompt = str(payload.get("prompt", "")).strip()
    options = payload.get("options", [])
    correct_idx = payload.get("correctIndex")
    marks = int(payload.get("marks", 2))
    if not prompt or not isinstance(options, list) or len(options) < 2:
        return {"ok": False, "error": "INVALID_QUESTION"}
    if not isinstance(correct_idx, int) or correct_idx < 0 or correct_idx >= len(options):
        return {"ok": False, "error": "INVALID_QUESTION"}
    new_q = {
        "id": f"q{len(QUESTIONS) + 1}",
        "prompt": prompt,
        "options": options,
        "correctIndex": correct_idx,
        "marks": marks
    }
    QUESTIONS.append(new_q)
    return {"ok": True, "questionId": new_q["id"], "totalQuestions": len(QUESTIONS)}
`,
      },
      {
        name: "grading_engine.py",
        language: "python",
        content: `from question_bank import QUESTIONS

def grade_submission(answers, time_taken_sec, time_limit_sec=600):
    if time_taken_sec < 0:
        return {"ok": False, "error": "INVALID_TIME"}
    if time_taken_sec > time_limit_sec:
        return {"ok": False, "error": "TIME_LIMIT_EXCEEDED"}

    total_marks = sum(q["marks"] for q in QUESTIONS)
    obtained = 0
    correct_count = 0

    for q in QUESTIONS:
        qid = q["id"]
        if answers and qid in answers and answers[qid] == q["correctIndex"]:
            obtained += q["marks"]
            correct_count += 1

    pct = round((obtained / total_marks) * 100) if total_marks > 0 else 0
    passed = pct >= 80
    grade = "A+" if pct >= 90 else "A" if pct >= 80 else "B" if pct >= 70 else "F"
    return {
        "ok": True,
        "marksObtained": obtained,
        "totalMarks": total_marks,
        "percentage": pct,
        "correctCount": correct_count,
        "grade": grade,
        "passed": passed
    }
`,
      },
    ],
    testCases: [
      {
        name: "Fetch sanitized exam paper without exposing correctIndex",
        input: '{"action":"fetch_exam","payload":{}}',
        expectedOutput: '{"ok": true, "count": 3, "questions": [{"id": "q1", "prompt": "HTTP status for Created?", "options": ["200", "201", "204"], "marks": 3}, {"id": "q2", "prompt": "PostgreSQL ACID property I stands for?", "options": ["Indexing", "Isolation", "Integrity"], "marks": 3}, {"id": "q3", "prompt": "Time complexity of binary search?", "options": ["O(n)", "O(log n)", "O(1)"], "marks": 4}]}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Grade 100% passing exam submission within time limit",
        input: '{"action":"submit_exam","payload":{"answers":{"q1":1,"q2":1,"q3":1},"timeTakenSec":420,"timeLimitSec":600}}',
        expectedOutput: '{"ok": true, "marksObtained": 10, "totalMarks": 10, "percentage": 100, "correctCount": 3, "grade": "A+", "passed": true}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Grade partial submission scoring below 80% threshold",
        input: '{"action":"submit_exam","payload":{"answers":{"q1":1,"q2":0,"q3":1},"timeTakenSec":300,"timeLimitSec":600}}',
        expectedOutput: '{"ok": true, "marksObtained": 7, "totalMarks": 10, "percentage": 70, "correctCount": 2, "grade": "B", "passed": false}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Add validated question to exam bank",
        input: '{"action":"add_question","payload":{"prompt":"Default port for PostgreSQL?","options":["3306","5432","6379"],"correctIndex":1,"marks":5}}',
        expectedOutput: '{"ok": true, "questionId": "q4", "totalQuestions": 4}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Reject late submission exceeding server time limit (Edge Case)",
        input: '{"action":"submit_exam","payload":{"answers":{"q1":1,"q2":1,"q3":1},"timeTakenSec":750,"timeLimitSec":600}}',
        expectedOutput: '{"ok": false, "error": "TIME_LIMIT_EXCEEDED"}',
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Reject new question with out-of-range answer index (Edge Case)",
        input: '{"action":"add_question","payload":{"prompt":"Invalid Q","options":["A","B"],"correctIndex":5}}',
        expectedOutput: '{"ok": false, "error": "INVALID_QUESTION"}',
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },

  // =========================================================================
  // 9. NEW PROJECT 5: Hospital Management System
  // =========================================================================
  {
    id: "proj_hospital_mgmt",
    title: "Hospital Management System",
    category: "Enterprise Java",
    track: "Java",
    level: "Intermediate",
    difficulty: "Intermediate",
    starterLanguage: "java",
    technologies: ["Java", "Spring Boot Architecture", "MySQL", "RBAC", "Billing Engine"],
    estimatedTime: "6 Hours",
    xpReward: 500,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Develop a Hospital Management System in Java handling patient registration, doctor slot scheduling with conflict detection, itemized medical billing with insurance deduction, and role-based access control.",
    problemStatement:
      "Healthcare information systems must prevent double-booking doctor appointment slots, calculate patient invoices accurately with insurance coverage percentages, and restrict sensitive medical/billing mutations to authorized clinical roles.",
    realWorldScenario:
      "You are implementing the core domain service layer for a Spring Boot + MySQL Hospital Management System.",
    objectives: [
      "Model `Patient` and `DoctorSlot` domain records in `HospitalModels.java`.",
      "Implement appointment booking with double-booking conflict detection (`SLOT_ALREADY_BOOKED`) in `HospitalService.java`.",
      "Compute itemized patient billing (`consultation + labCost - insuranceCoverage`) and enforce `DOCTOR`/`ADMIN` role authorization.",
      "Process clinical commands deterministically in `Main.java`.",
    ],
    ioSpecification: {
      inputFormat: "Command string on stdin: REGISTER_PATIENT, BOOK_SLOT, DOUBLE_BOOK, BILL_INSURED, UNAUTH_BILL, or INVALID_BILL",
      outputFormat: "Structured clinical response line with status and computed values.",
    },
    deliverables: [
      "Patient & Doctor domain models (HospitalModels.java)",
      "Appointment scheduler, RBAC & billing engine (HospitalService.java)",
      "Clinical CLI runner (Main.java)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_hosp_1", title: "Patient Registration & Triage Validation", description: "Register patient with ID, name, and age > 0.", mandatory: true, validationPatterns: ["registerPatient", "Patient"] },
      { id: "fr_hosp_2", title: "Doctor Appointment Slot Conflict Detection", description: "Book available doctor slots and reject duplicate bookings for the same slot with SLOT_ALREADY_BOOKED.", mandatory: true, validationPatterns: ["bookAppointment", "SLOT_ALREADY_BOOKED"] },
      { id: "fr_hosp_3", title: "Medical Billing & Insurance Deduction", description: "Compute net payable bill after applying insurance coverage percentage.", mandatory: true, validationPatterns: ["generateBill", "insurancePct"] },
      { id: "fr_hosp_4", title: "Clinical Role-Based Access Control", description: "Restrict billing generation to ADMIN or DOCTOR roles (reject GUEST/PATIENT with FORBIDDEN_ROLE).", mandatory: true, validationPatterns: ["FORBIDDEN_ROLE", "ADMIN"] },
    ],
    technicalRequirements: [
      { id: "tr_hosp_1", title: "Multi-Class Java Architecture", constraint: "Separate domain models (HospitalModels.java), service logic (HospitalService.java), and entry point (Main.java).", mandatory: true, validationPatterns: ["class HospitalService", "class Main"] },
      { id: "tr_hosp_2", title: "In-Memory Slot State Consistency", constraint: "Track booked slots accurately across consecutive booking calls.", mandatory: true, validationPatterns: ["Set", "contains"] },
      { id: "tr_hosp_3", title: "Negative Cost Validation", constraint: "Reject negative consultation or lab charges with INVALID_CHARGE.", mandatory: true, validationPatterns: ["INVALID_CHARGE"] },
    ],
    milestones: [
      {
        id: "task_hosp_1",
        stepNumber: 1,
        title: "Design Patient & Appointment Domain Models",
        question: "Implement `Patient` and slot representation in `HospitalModels.java`.",
        expectedFunctionality: "Encapsulates patient demographics and appointment slot keys.",
        technicalConstraints: "Validate patient age > 0.",
        acceptanceCriteria: "Registering patient `P-201` outputs `PATIENT_REGISTERED:P-201:Meera Nair`.",
        marksAllocated: 25,
        targetFile: "HospitalModels.java",
        validationPatterns: ["class Patient", "getName"],
      },
      {
        id: "task_hosp_2",
        stepNumber: 2,
        title: "Implement Appointment Conflict Detection & Insurance Billing",
        question: "Implement `bookAppointment`, `registerPatient`, and `generateBill` in `HospitalService.java`.",
        expectedFunctionality: "Prevents double-booking slots, enforces RBAC on billing, and deducts insurance percentage.",
        technicalConstraints: "Return `SLOT_ALREADY_BOOKED` on duplicate slot and `FORBIDDEN_ROLE` on unauthorized billing.",
        acceptanceCriteria: "Billing 1000 consultation + 500 lab with 20% insurance yields net `1200`.",
        marksAllocated: 45,
        targetFile: "HospitalService.java",
        validationPatterns: ["bookAppointment", "generateBill", "SLOT_ALREADY_BOOKED", "FORBIDDEN_ROLE"],
      },
      {
        id: "task_hosp_3",
        stepNumber: 3,
        title: "Wire Clinical Command Dispatcher in Main.java",
        question: "Connect `Main.java` to `HospitalService` to process all 6 clinical test scenarios.",
        expectedFunctionality: "Handles registration, slot booking, double-booking, billing, and RBAC errors.",
        technicalConstraints: "Compile cleanly with `javac *.java`.",
        acceptanceCriteria: "All 6 hospital management test cases pass.",
        marksAllocated: 30,
        targetFile: "Main.java",
        validationPatterns: ["public static void main", "HospitalService"],
      },
    ],
    files: [
      {
        name: "Main.java",
        language: "java",
        content: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String cmd = sc.hasNextLine() ? sc.nextLine().trim() : "";
        // TODO: Dispatch hospital commands via HospitalService
        System.out.println("ERROR: Hospital service not implemented");
    }
}
`,
      },
      {
        name: "HospitalModels.java",
        language: "java",
        content: `class Patient {
    private String id;
    private String name;
    private int age;

    public Patient(String id, String name, int age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public int getAge() { return age; }
}
`,
      },
      {
        name: "HospitalService.java",
        language: "java",
        content: `public class HospitalService {
    // TODO: Implement registerPatient, bookAppointment, and generateBill
}
`,
      },
    ],
    solutionFiles: [
      {
        name: "Main.java",
        language: "java",
        content: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String cmd = sc.hasNextLine() ? sc.nextLine().trim() : "";
        HospitalService svc = new HospitalService();

        if ("REGISTER_PATIENT".equals(cmd)) {
            System.out.println(svc.registerPatient("P-201", "Meera Nair", 34));
        } else if ("BOOK_SLOT".equals(cmd)) {
            System.out.println(svc.bookAppointment("DR-CARDIO", "10:00", "P-201"));
        } else if ("DOUBLE_BOOK".equals(cmd)) {
            svc.bookAppointment("DR-CARDIO", "10:00", "P-201");
            System.out.println(svc.bookAppointment("DR-CARDIO", "10:00", "P-202"));
        } else if ("BILL_INSURED".equals(cmd)) {
            System.out.println(svc.generateBill("ADMIN", "P-201", 1000, 500, 20));
        } else if ("UNAUTH_BILL".equals(cmd)) {
            System.out.println(svc.generateBill("GUEST", "P-201", 1000, 500, 20));
        } else if ("INVALID_BILL".equals(cmd)) {
            System.out.println(svc.generateBill("ADMIN", "P-201", -200, 500, 10));
        } else {
            System.out.println("UNKNOWN_COMMAND");
        }
    }
}
`,
      },
      {
        name: "HospitalModels.java",
        language: "java",
        content: `class Patient {
    private String id;
    private String name;
    private int age;

    public Patient(String id, String name, int age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public int getAge() { return age; }
}
`,
      },
      {
        name: "HospitalService.java",
        language: "java",
        content: `import java.util.HashSet;
import java.util.Set;

public class HospitalService {
    private Set<String> bookedSlots = new HashSet<>();

    public String registerPatient(String id, String name, int age) {
        if (id == null || name == null || name.trim().isEmpty() || age <= 0) {
            return "ERROR:INVALID_PATIENT";
        }
        Patient p = new Patient(id, name.trim(), age);
        return "PATIENT_REGISTERED:" + p.getId() + ":" + p.getName();
    }

    public String bookAppointment(String doctorId, String slot, String patientId) {
        String key = doctorId + "@" + slot;
        if (bookedSlots.contains(key)) {
            return "ERROR:SLOT_ALREADY_BOOKED:" + key;
        }
        bookedSlots.add(key);
        return "APPOINTMENT_CONFIRMED:" + key + ":" + patientId;
    }

    public String generateBill(String role, String patientId, int consultFee, int labFee, int insurancePct) {
        if (!"ADMIN".equals(role) && !"DOCTOR".equals(role)) {
            return "ERROR:FORBIDDEN_ROLE";
        }
        if (consultFee < 0 || labFee < 0 || insurancePct < 0 || insurancePct > 100) {
            return "ERROR:INVALID_CHARGE";
        }
        int gross = consultFee + labFee;
        int discount = (gross * insurancePct) / 100;
        int net = gross - discount;
        return "BILL_GENERATED:" + patientId + ":GROSS=" + gross + ",NET=" + net;
    }
}
`,
      },
    ],
    testCases: [
      {
        name: "Register new clinical patient P-201",
        input: "REGISTER_PATIENT",
        expectedOutput: "PATIENT_REGISTERED:P-201:Meera Nair",
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Book available cardiology appointment slot",
        input: "BOOK_SLOT",
        expectedOutput: "APPOINTMENT_CONFIRMED:DR-CARDIO@10:00:P-201",
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Generate itemized patient invoice with 20% insurance coverage",
        input: "BILL_INSURED",
        expectedOutput: "BILL_GENERATED:P-201:GROSS=1500,NET=1200",
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Prevent double-booking an already reserved doctor slot",
        input: "DOUBLE_BOOK",
        expectedOutput: "ERROR:SLOT_ALREADY_BOOKED:DR-CARDIO@10:00",
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Block unauthorized GUEST role from generating patient bill (Edge Case)",
        input: "UNAUTH_BILL",
        expectedOutput: "ERROR:FORBIDDEN_ROLE",
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Reject negative consultation fee with INVALID_CHARGE (Edge Case)",
        input: "INVALID_BILL",
        expectedOutput: "ERROR:INVALID_CHARGE",
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },

  // =========================================================================
  // 10. NEW PROJECT 6: AI-Powered Resume Analyzer
  // =========================================================================
  {
    id: "proj_resume_analyzer",
    title: "AI-Powered Resume Analyzer",
    category: "AI & Data Engineering",
    track: "Python",
    level: "Advanced",
    difficulty: "Advanced",
    starterLanguage: "python",
    technologies: ["Python", "FastAPI", "React", "NLP Skill Extraction"],
    estimatedTime: "6 Hours",
    xpReward: 550,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Build an AI-Powered Resume Analyzer performing NLP text tokenization, canonical technical skill extraction, job-description (JD) overlap scoring, missing-skill gap detection, and actionable ATS feedback generation.",
    problemStatement:
      "Recruiting and career readiness platforms need an NLP pipeline that parses unstructured candidate resume text, extracts technical skills against a canonical taxonomy, computes weighted match scores against required job-description skills, and produces specific upskilling recommendations.",
    realWorldScenario:
      "You are building the NLP resume parser and ATS scoring microservice for a FastAPI + React career intelligence platform.",
    objectives: [
      "Tokenize and normalize unstructured resume text and extract canonical technical skills in `nlp_extractor.py`.",
      "Compare extracted resume skills against required Job Description (JD) skills in `ats_scorer.py`.",
      "Compute `match_score` (0..100), `matched_skills`, `missing_skills`, and `recommendation` tier.",
      "Reject empty resume text or empty JD skill lists with structured validation errors.",
    ],
    ioSpecification: {
      inputFormat: "JSON object on stdin: { resumeText: string, requiredSkills: string[] }",
      outputFormat: "JSON ATS evaluation report: { ok, matchScore, matchedSkills, missingSkills, tier }",
    },
    deliverables: [
      "NLP tokenizer & canonical skill extractor (nlp_extractor.py)",
      "JD matcher & ATS feedback engine (ats_scorer.py)",
      "Pipeline entry point (main.py)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_res_1", title: "Case-Insensitive NLP Skill Extraction", description: "Normalize resume text and accurately detect multi-word and single-word technical skills.", mandatory: true, validationPatterns: ["extract_skills", "lower"] },
      { id: "fr_res_2", title: "Job-Description (JD) Match Scoring", description: "Calculate percentage of required JD skills present in the candidate resume.", mandatory: true, validationPatterns: ["evaluate_resume", "matchScore", "missingSkills"] },
      { id: "fr_res_3", title: "Missing-Skill Gap & Tier Classification", description: "Classify candidate into 'STRONG_MATCH' (>=75), 'MODERATE_MATCH' (>=50), or 'NEEDS_UPSKILLING' (<50).", mandatory: true, validationPatterns: ["STRONG_MATCH", "MODERATE_MATCH", "NEEDS_UPSKILLING"] },
      { id: "fr_res_4", title: "Empty Resume & Empty JD Guards", description: "Return EMPTY_RESUME or EMPTY_JD_REQUIREMENTS when inputs are blank.", mandatory: true, validationPatterns: ["EMPTY_RESUME", "EMPTY_JD_REQUIREMENTS"] },
    ],
    technicalRequirements: [
      { id: "tr_res_1", title: "Modular NLP & Scorer Separation", constraint: "Separate skill extraction (nlp_extractor.py), ATS scoring (ats_scorer.py), and CLI entry (main.py).", mandatory: true, validationPatterns: ["from nlp_extractor import", "from ats_scorer import"] },
      { id: "tr_res_2", title: "Deterministic Skill Ordering", constraint: "Preserve JD requirement order in matchedSkills and missingSkills lists.", mandatory: true, validationPatterns: ["matched", "missing"] },
      { id: "tr_res_3", title: "Punctuation-Safe Token Matching", constraint: "Match skills accurately even when followed by commas, periods, or parentheses.", mandatory: true, validationPatterns: ["re.sub", "lower"] },
    ],
    milestones: [
      {
        id: "task_res_1",
        stepNumber: 1,
        title: "Build NLP Text Normalizer & Skill Extractor",
        question: "Implement `normalize_text(text)` and `extract_skills(resume_text, candidate_skills)` in `nlp_extractor.py`.",
        expectedFunctionality: "Cleans punctuation and identifies which candidate skills appear in the resume text.",
        technicalConstraints: "Case-insensitive matching.",
        acceptanceCriteria: "Detects `python`, `fastapi`, `postgresql`, and `docker` from raw resume text.",
        marksAllocated: 35,
        targetFile: "nlp_extractor.py",
        validationPatterns: ["def normalize_text", "def extract_skills"],
      },
      {
        id: "task_res_2",
        stepNumber: 2,
        title: "Implement JD Matcher & ATS Tier Scorer",
        question: "Implement `evaluate_resume(resume_text, required_skills)` in `ats_scorer.py`.",
        expectedFunctionality: "Computes `matchScore`, `matchedSkills`, `missingSkills`, and `tier`.",
        technicalConstraints: "Validate non-empty resume and non-empty `required_skills`.",
        acceptanceCriteria: "3 of 4 matched skills yields `matchScore: 75`, `tier: 'STRONG_MATCH'`.",
        marksAllocated: 35,
        targetFile: "ats_scorer.py",
        validationPatterns: ["def evaluate_resume", "STRONG_MATCH", "missingSkills"],
      },
      {
        id: "task_res_3",
        stepNumber: 3,
        title: "Wire Resume Analyzer CLI in main.py",
        question: "Connect `ats_scorer.py` in `main.py` to process JSON payloads from stdin.",
        expectedFunctionality: "Reads `resumeText` and `requiredSkills` and outputs the JSON ATS evaluation.",
        technicalConstraints: "Catch malformed JSON cleanly.",
        acceptanceCriteria: "All 6 NLP resume analyzer test cases pass.",
        marksAllocated: 30,
        targetFile: "main.py",
        validationPatterns: ["evaluate_resume", "json.dumps"],
      },
    ],
    files: [
      {
        name: "main.py",
        language: "python",
        content: `import sys
import json
from ats_scorer import evaluate_resume

# TODO: Parse stdin JSON { resumeText, requiredSkills } and print evaluate_resume result
print(json.dumps({"ok": False, "error": "Resume analyzer not implemented"}))
`,
      },
      {
        name: "nlp_extractor.py",
        language: "python",
        content: `import re

def normalize_text(text):
    # TODO: Lowercase and normalize punctuation
    return ""

def extract_skills(resume_text, skill_list):
    # TODO: Return matched skills from skill_list found in resume_text
    return []
`,
      },
      {
        name: "ats_scorer.py",
        language: "python",
        content: `from nlp_extractor import extract_skills

def evaluate_resume(resume_text, required_skills):
    # TODO: Validate inputs, compute matchScore, matchedSkills, missingSkills, and tier
    return {"ok": False}
`,
      },
    ],
    solutionFiles: [
      {
        name: "main.py",
        language: "python",
        content: `import sys
import json
from ats_scorer import evaluate_resume

def main():
    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"ok": False, "error": "EMPTY_INPUT"}))
        return
    try:
        req = json.loads(raw)
        res = evaluate_resume(req.get("resumeText", ""), req.get("requiredSkills", []))
        print(json.dumps(res))
    except Exception:
        print(json.dumps({"ok": False, "error": "INVALID_JSON"}))

if __name__ == "__main__":
    main()
`,
      },
      {
        name: "nlp_extractor.py",
        language: "python",
        content: `import re

def normalize_text(text):
    cleaned = re.sub(r"[^a-z0-9+#.\\s-]", " ", str(text or "").lower())
    tokens = [t.strip(".") for t in cleaned.split() if t.strip(".")]
    return " " + " ".join(tokens) + " "

def extract_skills(resume_text, skill_list):
    norm = normalize_text(resume_text)
    found = []
    for sk in skill_list:
        target = " " + str(sk).strip().lower() + " "
        if target in norm:
            found.append(sk)
    return found
`,
      },
      {
        name: "ats_scorer.py",
        language: "python",
        content: `from nlp_extractor import extract_skills

def evaluate_resume(resume_text, required_skills):
    if not resume_text or not str(resume_text).strip():
        return {"ok": False, "error": "EMPTY_RESUME"}
    if not required_skills or not isinstance(required_skills, list):
        return {"ok": False, "error": "EMPTY_JD_REQUIREMENTS"}

    matched = extract_skills(resume_text, required_skills)
    matched_lower = {m.lower() for m in matched}
    missing = [s for s in required_skills if s.lower() not in matched_lower]

    score = round((len(matched) / len(required_skills)) * 100)
    if score >= 75:
        tier = "STRONG_MATCH"
    elif score >= 50:
        tier = "MODERATE_MATCH"
    else:
        tier = "NEEDS_UPSKILLING"

    return {
        "ok": True,
        "matchScore": score,
        "matchedSkills": matched,
        "missingSkills": missing,
        "tier": tier
    }
`,
      },
    ],
    testCases: [
      {
        name: "Evaluate strong-match backend engineer resume (75% match)",
        input: '{"resumeText":"Built scalable microservices using Python, FastAPI, and PostgreSQL on Linux.","requiredSkills":["Python","FastAPI","PostgreSQL","Docker"]}',
        expectedOutput: '{"ok": true, "matchScore": 75, "matchedSkills": ["Python", "FastAPI", "PostgreSQL"], "missingSkills": ["Docker"], "tier": "STRONG_MATCH"}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Evaluate 100% full-stack match",
        input: '{"resumeText":"Experienced in React, Node.js, and MongoDB.","requiredSkills":["React","Node.js","MongoDB"]}',
        expectedOutput: '{"ok": true, "matchScore": 100, "matchedSkills": ["React", "Node.js", "MongoDB"], "missingSkills": [], "tier": "STRONG_MATCH"}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Classify moderate match (50%) and identify missing skills",
        input: '{"resumeText":"Developed apps in Python and SQL.","requiredSkills":["Python","SQL","Kubernetes","Redis"]}',
        expectedOutput: '{"ok": true, "matchScore": 50, "matchedSkills": ["Python", "SQL"], "missingSkills": ["Kubernetes", "Redis"], "tier": "MODERATE_MATCH"}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Classify low match (<50%) as NEEDS_UPSKILLING",
        input: '{"resumeText":"Graphic designer learning HTML.","requiredSkills":["HTML","React","TypeScript","GraphQL"]}',
        expectedOutput: '{"ok": true, "matchScore": 25, "matchedSkills": ["HTML"], "missingSkills": ["React", "TypeScript", "GraphQL"], "tier": "NEEDS_UPSKILLING"}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Reject blank resume text with EMPTY_RESUME (Edge Case)",
        input: '{"resumeText":"   ","requiredSkills":["Python"]}',
        expectedOutput: '{"ok": false, "error": "EMPTY_RESUME"}',
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Reject empty job description skill list with EMPTY_JD_REQUIREMENTS (Edge Case)",
        input: '{"resumeText":"Python developer","requiredSkills":[]}',
        expectedOutput: '{"ok": false, "error": "EMPTY_JD_REQUIREMENTS"}',
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },

  // =========================================================================
  // 11. NEW PROJECT 7: Inventory & Warehouse Management System
  // =========================================================================
  {
    id: "proj_inventory_warehouse",
    title: "Inventory & Warehouse Management System",
    category: "Enterprise Java",
    track: "Java",
    level: "Intermediate",
    difficulty: "Intermediate",
    starterLanguage: "java",
    technologies: ["Java", "Spring Boot", "PostgreSQL", "Supply Chain", "Low-Stock Alerts"],
    estimatedTime: "5 Hours",
    xpReward: 450,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Build an Inventory & Warehouse Management System in Java supporting SKU stock inbound/outbound mutations, supplier restock orders, automated low-stock reorder alerts, and warehouse valuation.",
    problemStatement:
      "Warehouse operations require real-time SKU tracking across inbound supplier shipments and outbound fulfillment orders, automatic low-stock threshold alerts (`quantity <= reorderThreshold`), and strict prevention of negative inventory balances.",
    realWorldScenario:
      "You are developing the warehouse inventory service layer for an enterprise logistics platform built with Java and PostgreSQL.",
    objectives: [
      "Model `InventoryItem` with SKU, name, quantity, unitCost, and reorderThreshold in `InventoryItem.java`.",
      "Implement inbound restock (`restock`), outbound dispatch (`dispatch`), low-stock alert scanner (`getLowStockAlerts`), and total valuation in `WarehouseService.java`.",
      "Trigger `LOW_STOCK_ALERT` whenever an outbound dispatch drops quantity `<= reorderThreshold`.",
      "Reject dispatches exceeding available stock (`INSUFFICIENT_STOCK`) or non-positive quantities (`INVALID_QTY`).",
    ],
    ioSpecification: {
      inputFormat: "Command string on stdin: DISPATCH_OK, DISPATCH_LOW_ALERT, RESTOCK, VALUATION, OVER_DISPATCH, or INVALID_QTY",
      outputFormat: "Structured warehouse telemetry line.",
    },
    deliverables: [
      "Inventory SKU entity model (InventoryItem.java)",
      "Warehouse stock & alert manager (WarehouseService.java)",
      "CLI runner (Main.java)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_inv_1", title: "Outbound Dispatch & Low-Stock Threshold Detection", description: "Deduct outbound quantity and flag LOW_STOCK_ALERT if remaining quantity <= reorderThreshold.", mandatory: true, validationPatterns: ["dispatch", "LOW_STOCK_ALERT", "isLowStock"] },
      { id: "fr_inv_2", title: "Supplier Inbound Restock", description: "Increase SKU quantity on valid supplier delivery.", mandatory: true, validationPatterns: ["restock"] },
      { id: "fr_inv_3", title: "Warehouse Total Valuation", description: "Compute sum of (quantity * unitCost) across all warehouse SKUs.", mandatory: true, validationPatterns: ["getTotalValuation", "unitCost"] },
      { id: "fr_inv_4", title: "Over-Dispatch & Invalid Quantity Guards", description: "Reject quantity <= 0 (INVALID_QTY) and quantity > stock (INSUFFICIENT_STOCK).", mandatory: true, validationPatterns: ["INSUFFICIENT_STOCK", "INVALID_QTY"] },
    ],
    technicalRequirements: [
      { id: "tr_inv_1", title: "Multi-File Java Domain & Service Split", constraint: "Separate SKU entity (InventoryItem.java), warehouse logic (WarehouseService.java), and runner (Main.java).", mandatory: true, validationPatterns: ["class InventoryItem", "class WarehouseService"] },
      { id: "tr_inv_2", title: "Encapsulated Entity Methods", constraint: "Provide clean getters/mutators and isLowStock() helper on InventoryItem.", mandatory: true, validationPatterns: ["isLowStock"] },
      { id: "tr_inv_3", title: "Atomic Stock Guard", constraint: "Never allow quantity to become negative.", mandatory: true, validationPatterns: ["quantity"] },
    ],
    milestones: [
      {
        id: "task_inv_1",
        stepNumber: 1,
        title: "Implement InventoryItem Entity & Threshold Logic",
        question: "Implement `InventoryItem` in `InventoryItem.java` with `isLowStock()` (`quantity <= reorderThreshold`).",
        expectedFunctionality: "Stores SKU metadata, current stock, unit cost, and low-stock threshold.",
        technicalConstraints: "Compute item valuation as `quantity * unitCost`.",
        acceptanceCriteria: "Item with `quantity=8` and `reorderThreshold=10` returns `isLowStock() == true`.",
        marksAllocated: 30,
        targetFile: "InventoryItem.java",
        validationPatterns: ["class InventoryItem", "isLowStock", "unitCost"],
      },
      {
        id: "task_inv_2",
        stepNumber: 2,
        title: "Build Warehouse Dispatch, Restock & Valuation Service",
        question: "Implement `dispatch`, `restock`, and `getTotalValuation` in `WarehouseService.java`.",
        expectedFunctionality: "Validates quantities, updates stock, emits low-stock alerts, and computes total inventory value.",
        technicalConstraints: "Return `ERROR:INSUFFICIENT_STOCK` when dispatch exceeds quantity.",
        acceptanceCriteria: "Dispatching 42 units of `SKU-SSD` (initial 50, threshold 10) outputs `DISPATCHED:SKU-SSD:REM=8:LOW_STOCK_ALERT`.",
        marksAllocated: 40,
        targetFile: "WarehouseService.java",
        validationPatterns: ["dispatch", "restock", "getTotalValuation", "LOW_STOCK_ALERT"],
      },
      {
        id: "task_inv_3",
        stepNumber: 3,
        title: "Wire Warehouse Command Runner in Main.java",
        question: "Connect `Main.java` to `WarehouseService` for all 6 warehouse scenarios.",
        expectedFunctionality: "Executes DISPATCH_OK, DISPATCH_LOW_ALERT, RESTOCK, VALUATION, OVER_DISPATCH, and INVALID_QTY.",
        technicalConstraints: "Compile cleanly with `javac *.java`.",
        acceptanceCriteria: "All 6 warehouse test cases pass.",
        marksAllocated: 30,
        targetFile: "Main.java",
        validationPatterns: ["public static void main", "WarehouseService"],
      },
    ],
    files: [
      {
        name: "Main.java",
        language: "java",
        content: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String cmd = sc.hasNextLine() ? sc.nextLine().trim() : "";
        // TODO: Dispatch warehouse commands
        System.out.println("ERROR: Warehouse system not implemented");
    }
}
`,
      },
      {
        name: "InventoryItem.java",
        language: "java",
        content: `public class InventoryItem {
    // TODO: Define sku, quantity, unitCost, reorderThreshold and isLowStock()
}
`,
      },
      {
        name: "WarehouseService.java",
        language: "java",
        content: `public class WarehouseService {
    // TODO: Implement dispatch, restock, and getTotalValuation
}
`,
      },
    ],
    solutionFiles: [
      {
        name: "Main.java",
        language: "java",
        content: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String cmd = sc.hasNextLine() ? sc.nextLine().trim() : "";
        WarehouseService svc = new WarehouseService();

        if ("DISPATCH_OK".equals(cmd)) {
            System.out.println(svc.dispatch("SKU-SSD", 20));
        } else if ("DISPATCH_LOW_ALERT".equals(cmd)) {
            System.out.println(svc.dispatch("SKU-SSD", 42));
        } else if ("RESTOCK".equals(cmd)) {
            System.out.println(svc.restock("SKU-RAM", 15));
        } else if ("VALUATION".equals(cmd)) {
            System.out.println(svc.getTotalValuation());
        } else if ("OVER_DISPATCH".equals(cmd)) {
            System.out.println(svc.dispatch("SKU-RAM", 100));
        } else if ("INVALID_QTY".equals(cmd)) {
            System.out.println(svc.restock("SKU-SSD", 0));
        } else {
            System.out.println("UNKNOWN_COMMAND");
        }
    }
}
`,
      },
      {
        name: "InventoryItem.java",
        language: "java",
        content: `public class InventoryItem {
    private String sku;
    private int quantity;
    private int unitCost;
    private int reorderThreshold;

    public InventoryItem(String sku, int quantity, int unitCost, int reorderThreshold) {
        this.sku = sku;
        this.quantity = quantity;
        this.unitCost = unitCost;
        this.reorderThreshold = reorderThreshold;
    }

    public String getSku() { return sku; }
    public int getQuantity() { return quantity; }
    public int getUnitCost() { return unitCost; }
    public void addStock(int qty) { this.quantity += qty; }
    public void removeStock(int qty) { this.quantity -= qty; }
    public boolean isLowStock() { return this.quantity <= this.reorderThreshold; }
}
`,
      },
      {
        name: "WarehouseService.java",
        language: "java",
        content: `import java.util.LinkedHashMap;
import java.util.Map;

public class WarehouseService {
    private Map<String, InventoryItem> stock = new LinkedHashMap<>();

    public WarehouseService() {
        stock.put("SKU-SSD", new InventoryItem("SKU-SSD", 50, 100, 10));
        stock.put("SKU-RAM", new InventoryItem("SKU-RAM", 20, 50, 5));
    }

    public String dispatch(String sku, int qty) {
        if (qty <= 0) return "ERROR:INVALID_QTY";
        InventoryItem item = stock.get(sku);
        if (item == null) return "ERROR:SKU_NOT_FOUND";
        if (qty > item.getQuantity()) return "ERROR:INSUFFICIENT_STOCK";
        item.removeStock(qty);
        String alert = item.isLowStock() ? "LOW_STOCK_ALERT" : "NORMAL";
        return "DISPATCHED:" + sku + ":REM=" + item.getQuantity() + ":" + alert;
    }

    public String restock(String sku, int qty) {
        if (qty <= 0) return "ERROR:INVALID_QTY";
        InventoryItem item = stock.get(sku);
        if (item == null) return "ERROR:SKU_NOT_FOUND";
        item.addStock(qty);
        return "RESTOCKED:" + sku + ":QTY=" + item.getQuantity();
    }

    public String getTotalValuation() {
        int total = 0;
        for (InventoryItem item : stock.values()) {
            total += item.getQuantity() * item.getUnitCost();
        }
        return "WAREHOUSE_VALUATION:" + total;
    }
}
`,
      },
    ],
    testCases: [
      {
        name: "Dispatch 20 units of SKU-SSD with normal remaining stock",
        input: "DISPATCH_OK",
        expectedOutput: "DISPATCHED:SKU-SSD:REM=30:NORMAL",
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Trigger LOW_STOCK_ALERT when SKU-SSD drops below reorder threshold",
        input: "DISPATCH_LOW_ALERT",
        expectedOutput: "DISPATCHED:SKU-SSD:REM=8:LOW_STOCK_ALERT",
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Process supplier inbound restock for SKU-RAM",
        input: "RESTOCK",
        expectedOutput: "RESTOCKED:SKU-RAM:QTY=35",
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Calculate total warehouse inventory valuation",
        input: "VALUATION",
        expectedOutput: "WAREHOUSE_VALUATION:6000",
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Reject outbound dispatch exceeding warehouse stock (Edge Case)",
        input: "OVER_DISPATCH",
        expectedOutput: "ERROR:INSUFFICIENT_STOCK",
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Reject zero/negative restock quantity with INVALID_QTY (Edge Case)",
        input: "INVALID_QTY",
        expectedOutput: "ERROR:INVALID_QTY",
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },

  // =========================================================================
  // 12. NEW PROJECT 8: Personal Finance & Expense Tracker
  // =========================================================================
  {
    id: "proj_finance_tracker",
    title: "Personal Finance & Expense Tracker",
    category: "FinTech & Analytics",
    track: "Full-Stack Web Development",
    level: "Intermediate",
    difficulty: "Intermediate",
    starterLanguage: "javascript",
    technologies: ["React", "Node.js", "PostgreSQL", "Budget Analytics"],
    estimatedTime: "5 Hours",
    xpReward: 400,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Build a Personal Finance & Expense Tracker supporting income/expense transaction recording, category-level aggregation, monthly budget threshold alerts, and savings rate analytics.",
    problemStatement:
      "Personal finance applications must classify income and expense transactions accurately, compute category spending breakdowns, calculate net savings and savings rate percentages, and alert users when spending exceeds their monthly budget cap.",
    realWorldScenario:
      "You are building the financial analytics and ledger engine for a React + Node.js + PostgreSQL expense tracker.",
    objectives: [
      "Manage ledger transactions and validate new entries in `ledgerStore.js`.",
      "Aggregate total income, total expenses, net savings, savings rate %, and category totals in `budgetAnalytics.js`.",
      "Detect budget overruns (`totalExpenses > monthlyBudget`) and flag `OVER_BUDGET`.",
      "Reject negative/zero transaction amounts or invalid transaction types (`income` | `expense`).",
    ],
    ioSpecification: {
      inputFormat: "JSON command on stdin: { action: 'summary' | 'add_tx' | 'budget_check', payload: {...} }",
      outputFormat: "JSON financial report or validation error.",
    },
    deliverables: [
      "Transaction ledger & validator (ledgerStore.js)",
      "Monthly budget & category analytics engine (budgetAnalytics.js)",
      "Finance controller (main.js)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_fin_1", title: "Income, Expense & Savings Rate Calculation", description: "Compute totalIncome, totalExpense, netSavings, and savingsRatePct.", mandatory: true, validationPatterns: ["computeMonthlyReport", "netSavings", "savingsRatePct"] },
      { id: "fr_fin_2", title: "Category Expense Breakdown", description: "Group expense transactions by category (e.g. Housing, Food, Tech).", mandatory: true, validationPatterns: ["byCategory", "expense"] },
      { id: "fr_fin_3", title: "Monthly Budget Cap Alert", description: "Evaluate totalExpense against budgetLimit and return status 'OVER_BUDGET' or 'WITHIN_BUDGET'.", mandatory: true, validationPatterns: ["checkBudgetStatus", "OVER_BUDGET", "WITHIN_BUDGET"] },
      { id: "fr_fin_4", title: "Transaction Validation", description: "Reject amount <= 0 (INVALID_AMOUNT) or invalid type (INVALID_TYPE).", mandatory: true, validationPatterns: ["INVALID_AMOUNT", "INVALID_TYPE"] },
    ],
    technicalRequirements: [
      { id: "tr_fin_1", title: "Modular Ledger & Analytics Split", constraint: "Separate transaction store (ledgerStore.js), analytics (budgetAnalytics.js), and router (main.js).", mandatory: true, validationPatterns: ["require", "module.exports"] },
      { id: "tr_fin_2", title: "Savings Rate Precision", constraint: "Round savingsRatePct to 2 decimal places.", mandatory: true, validationPatterns: ["Math.round"] },
      { id: "tr_fin_3", title: "Safe Error Handling", constraint: "Return structured JSON errors on invalid inputs.", mandatory: true, validationPatterns: ["ok: false"] },
    ],
    milestones: [
      {
        id: "task_fin_1",
        stepNumber: 1,
        title: "Implement Transaction Ledger & Input Validator",
        question: "Implement `addTransaction(tx)` in `ledgerStore.js`.",
        expectedFunctionality: "Validates `type` (`income` or `expense`), `amount > 0`, and non-empty `category`.",
        technicalConstraints: "Return `INVALID_AMOUNT` or `INVALID_TYPE` on bad payloads.",
        acceptanceCriteria: "Valid expense transaction appends to ledger and returns updated count.",
        marksAllocated: 30,
        targetFile: "ledgerStore.js",
        validationPatterns: ["addTransaction", "INVALID_AMOUNT", "INVALID_TYPE"],
      },
      {
        id: "task_fin_2",
        stepNumber: 2,
        title: "Implement Monthly Summary & Budget Alert Engine",
        question: "Implement `computeMonthlyReport(transactions)` and `checkBudgetStatus(transactions, budgetLimit)` in `budgetAnalytics.js`.",
        expectedFunctionality: "Calculates income, expenses, net savings, savings rate, category map, and budget status.",
        technicalConstraints: "Flag `OVER_BUDGET` when `totalExpense > budgetLimit`.",
        acceptanceCriteria: "Income 5000 and Expenses 2000 yields `netSavings: 3000`, `savingsRatePct: 60`.",
        marksAllocated: 40,
        targetFile: "budgetAnalytics.js",
        validationPatterns: ["computeMonthlyReport", "checkBudgetStatus", "OVER_BUDGET"],
      },
      {
        id: "task_fin_3",
        stepNumber: 3,
        title: "Wire Finance Controller in main.js",
        question: "Connect `ledgerStore.js` and `budgetAnalytics.js` in `main.js`.",
        expectedFunctionality: "Routes `summary`, `add_tx`, and `budget_check` actions.",
        technicalConstraints: "Output valid JSON on stdout.",
        acceptanceCriteria: "All 6 personal finance test cases pass.",
        marksAllocated: 30,
        targetFile: "main.js",
        validationPatterns: ["computeMonthlyReport", "checkBudgetStatus", "JSON.stringify"],
      },
    ],
    files: [
      {
        name: "main.js",
        language: "javascript",
        content: `const fs = require("fs");
const { TRANSACTIONS, addTransaction } = require("./ledgerStore");
const { computeMonthlyReport, checkBudgetStatus } = require("./budgetAnalytics");

// TODO: Route 'summary', 'add_tx', and 'budget_check'
console.log(JSON.stringify({ ok: false, error: "Finance tracker not implemented" }));
`,
      },
      {
        name: "ledgerStore.js",
        language: "javascript",
        content: `const TRANSACTIONS = [
  { id: "tx_1", type: "income", category: "Salary", amount: 5000 },
  { id: "tx_2", type: "expense", category: "Housing", amount: 1500 },
  { id: "tx_3", type: "expense", category: "Food", amount: 500 }
];

function addTransaction(tx = {}) {
  // TODO: Validate type ('income'|'expense') and amount > 0
  return { ok: false };
}

module.exports = { TRANSACTIONS, addTransaction };
`,
      },
      {
        name: "budgetAnalytics.js",
        language: "javascript",
        content: `function computeMonthlyReport(transactions = []) {
  // TODO: Return totalIncome, totalExpense, netSavings, savingsRatePct, byCategory
  return {};
}

function checkBudgetStatus(transactions = [], budgetLimit = 2500) {
  // TODO: Return budget status ('WITHIN_BUDGET' | 'OVER_BUDGET')
  return {};
}

module.exports = { computeMonthlyReport, checkBudgetStatus };
`,
      },
    ],
    solutionFiles: [
      {
        name: "main.js",
        language: "javascript",
        content: `const fs = require("fs");
const { TRANSACTIONS, addTransaction } = require("./ledgerStore");
const { computeMonthlyReport, checkBudgetStatus } = require("./budgetAnalytics");

try {
  const req = JSON.parse(fs.readFileSync(0, "utf8").trim());
  const action = req.action;
  const payload = req.payload || {};

  if (action === "summary") {
    console.log(JSON.stringify({ ok: true, report: computeMonthlyReport(TRANSACTIONS) }));
  } else if (action === "add_tx") {
    const res = addTransaction(payload);
    if (!res.ok) {
      console.log(JSON.stringify(res));
    } else {
      console.log(JSON.stringify({ ok: true, report: computeMonthlyReport(TRANSACTIONS) }));
    }
  } else if (action === "budget_check") {
    console.log(JSON.stringify(checkBudgetStatus(TRANSACTIONS, payload.budgetLimit)));
  } else {
    console.log(JSON.stringify({ ok: false, error: "UNKNOWN_ACTION" }));
  }
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: "INVALID_JSON" }));
}
`,
      },
      {
        name: "ledgerStore.js",
        language: "javascript",
        content: `const TRANSACTIONS = [
  { id: "tx_1", type: "income", category: "Salary", amount: 5000 },
  { id: "tx_2", type: "expense", category: "Housing", amount: 1500 },
  { id: "tx_3", type: "expense", category: "Food", amount: 500 }
];

function addTransaction(tx = {}) {
  if (!["income", "expense"].includes(tx.type)) {
    return { ok: false, error: "INVALID_TYPE" };
  }
  const amount = Number(tx.amount);
  if (!amount || amount <= 0) {
    return { ok: false, error: "INVALID_AMOUNT" };
  }
  const item = {
    id: "tx_" + (TRANSACTIONS.length + 1),
    type: tx.type,
    category: String(tx.category || "General").trim(),
    amount
  };
  TRANSACTIONS.push(item);
  return { ok: true, transaction: item };
}

module.exports = { TRANSACTIONS, addTransaction };
`,
      },
      {
        name: "budgetAnalytics.js",
        language: "javascript",
        content: `function computeMonthlyReport(transactions = []) {
  let totalIncome = 0;
  let totalExpense = 0;
  const byCategory = {};

  for (const t of transactions) {
    if (t.type === "income") {
      totalIncome += t.amount;
    } else if (t.type === "expense") {
      totalExpense += t.amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
  }

  const netSavings = totalIncome - totalExpense;
  const savingsRatePct = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 10000) / 100 : 0;
  return { totalIncome, totalExpense, netSavings, savingsRatePct, byCategory };
}

function checkBudgetStatus(transactions = [], budgetLimit = 2500) {
  const limit = Number(budgetLimit);
  if (!limit || limit <= 0) return { ok: false, error: "INVALID_BUDGET" };
  const rep = computeMonthlyReport(transactions);
  const status = rep.totalExpense > limit ? "OVER_BUDGET" : "WITHIN_BUDGET";
  return {
    ok: true,
    totalExpense: rep.totalExpense,
    budgetLimit: limit,
    remaining: limit - rep.totalExpense,
    status
  };
}

module.exports = { computeMonthlyReport, checkBudgetStatus };
`,
      },
    ],
    testCases: [
      {
        name: "Compute monthly financial summary and category breakdown",
        input: '{"action":"summary","payload":{}}',
        expectedOutput: '{"ok":true,"report":{"totalIncome":5000,"totalExpense":2000,"netSavings":3000,"savingsRatePct":60,"byCategory":{"Housing":1500,"Food":500}}}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Record new Tech expense and recompute savings rate",
        input: '{"action":"add_tx","payload":{"type":"expense","category":"Tech","amount":500}}',
        expectedOutput: '{"ok":true,"report":{"totalIncome":5000,"totalExpense":2500,"netSavings":2500,"savingsRatePct":50,"byCategory":{"Housing":1500,"Food":500,"Tech":500}}}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Verify WITHIN_BUDGET when expenses are below cap",
        input: '{"action":"budget_check","payload":{"budgetLimit":2500}}',
        expectedOutput: '{"ok":true,"totalExpense":2000,"budgetLimit":2500,"remaining":500,"status":"WITHIN_BUDGET"}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Trigger OVER_BUDGET alert when expenses exceed cap",
        input: '{"action":"budget_check","payload":{"budgetLimit":1800}}',
        expectedOutput: '{"ok":true,"totalExpense":2000,"budgetLimit":1800,"remaining":-200,"status":"OVER_BUDGET"}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Reject negative transaction amount with INVALID_AMOUNT (Edge Case)",
        input: '{"action":"add_tx","payload":{"type":"expense","category":"Food","amount":-50}}',
        expectedOutput: '{"ok":false,"error":"INVALID_AMOUNT"}',
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Reject unsupported transaction type with INVALID_TYPE (Edge Case)",
        input: '{"action":"add_tx","payload":{"type":"crypto_gamble","category":"Misc","amount":100}}',
        expectedOutput: '{"ok":false,"error":"INVALID_TYPE"}',
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },

  // =========================================================================
  // 13. NEW PROJECT 9: URL Shortener & Analytics Platform
  // =========================================================================
  {
    id: "proj_url_shortener",
    title: "URL Shortener & Analytics Platform",
    category: "Backend & APIs",
    track: "Python / FastAPI",
    level: "Intermediate",
    difficulty: "Intermediate",
    starterLanguage: "python",
    technologies: ["Python", "FastAPI", "Redis Cache", "PostgreSQL", "Click Telemetry"],
    estimatedTime: "5 Hours",
    xpReward: 450,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Build a URL Shortener & Analytics Platform supporting deterministic Base62/SHA short-code generation, idempotent URL deduplication, redirect resolution with click counter increments, and referrer telemetry analytics.",
    problemStatement:
      "High-throughput URL shortening services must validate HTTP/HTTPS target URLs, generate collision-free short codes deterministically, resolve short codes in O(1) lookup time while incrementing click counters, and aggregate top-performing links.",
    realWorldScenario:
      "You are engineering the FastAPI + Redis + PostgreSQL core service for a link shortening and click-tracking platform.",
    objectives: [
      "Validate HTTP/HTTPS URLs and generate deterministic 6-character short codes in `shortener_service.py`.",
      "Resolve short codes (`resolve_short_code`), increment click counters, and track referrer sources.",
      "Aggregate link click analytics (`get_analytics`) in `analytics_store.py`.",
      "Reject malformed non-HTTP URLs (`INVALID_URL`) and unknown short codes (`CODE_NOT_FOUND`).",
    ],
    ioSpecification: {
      inputFormat: "JSON command on stdin: { action: 'shorten' | 'resolve' | 'analytics', payload: {...} }",
      outputFormat: "JSON response with shortCode, redirect targetUrl + clicks, or analytics summary.",
    },
    deliverables: [
      "Deterministic hash shortener & URL validator (shortener_service.py)",
      "Click counter & telemetry store (analytics_store.py)",
      "FastAPI-style command router (main.py)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_url_1", title: "Deterministic Short Code Generation & URL Validation", description: "Validate http:// or https:// prefix and compute deterministic 6-char SHA256 hex code.", mandatory: true, validationPatterns: ["shorten_url", "hashlib", "startswith"] },
      { id: "fr_url_2", title: "Redirect Resolution & Click Tracking", description: "Resolve short code to original URL and increment click count.", mandatory: true, validationPatterns: ["resolve_code", "clicks"] },
      { id: "fr_url_3", title: "Click Telemetry & Analytics Summary", description: "Report totalLinks, totalClicks, and topCode.", mandatory: true, validationPatterns: ["get_analytics", "totalClicks", "topCode"] },
      { id: "fr_url_4", title: "Invalid URL & Missing Code Guards", description: "Return INVALID_URL for non-http strings and CODE_NOT_FOUND for unknown short codes.", mandatory: true, validationPatterns: ["INVALID_URL", "CODE_NOT_FOUND"] },
    ],
    technicalRequirements: [
      { id: "tr_url_1", title: "Multi-File Python Architecture", constraint: "Separate link store (analytics_store.py), shortener logic (shortener_service.py), and router (main.py).", mandatory: true, validationPatterns: ["from shortener_service import", "from analytics_store import"] },
      { id: "tr_url_2", title: "Idempotent URL Shortening", constraint: "Shortening the same URL twice returns the same shortCode.", mandatory: true, validationPatterns: ["sha256"] },
      { id: "tr_url_3", title: "O(1) Dictionary Lookup", constraint: "Store shortCode mappings in a dictionary keyed by shortCode.", mandatory: true, validationPatterns: ["LINKS"] },
    ],
    milestones: [
      {
        id: "task_url_1",
        stepNumber: 1,
        title: "Implement Link Telemetry Store & Analytics Aggregator",
        question: "Implement `LINKS` store and `get_analytics()` in `analytics_store.py`.",
        expectedFunctionality: "Computes `totalLinks`, `totalClicks`, and `topCode` (short code with highest clicks).",
        technicalConstraints: "Seed initial links (`mz100a`, `mz200b`) for analytics baseline.",
        acceptanceCriteria: "`analytics` action returns `totalLinks: 2, totalClicks: 17, topCode: 'mz100a'`.",
        marksAllocated: 30,
        targetFile: "analytics_store.py",
        validationPatterns: ["LINKS", "def get_analytics", "topCode"],
      },
      {
        id: "task_url_2",
        stepNumber: 2,
        title: "Build URL Validator, Shortener & Redirect Resolver",
        question: "Implement `shorten_url(long_url)` and `resolve_code(code)` in `shortener_service.py`.",
        expectedFunctionality: "Validates `http://` or `https://`, creates 6-char `hashlib.sha256` hex code, and increments clicks on resolve.",
        technicalConstraints: "Return `INVALID_URL` or `CODE_NOT_FOUND` on invalid inputs.",
        acceptanceCriteria: "Resolving `mz100a` increments its clicks from 12 to 13.",
        marksAllocated: 40,
        targetFile: "shortener_service.py",
        validationPatterns: ["def shorten_url", "def resolve_code", "INVALID_URL", "CODE_NOT_FOUND"],
      },
      {
        id: "task_url_3",
        stepNumber: 3,
        title: "Wire Request Router in main.py",
        question: "Connect `shortener_service.py` and `analytics_store.py` in `main.py`.",
        expectedFunctionality: "Routes `shorten`, `resolve`, and `analytics` actions.",
        technicalConstraints: "Output valid JSON on stdout.",
        acceptanceCriteria: "All 6 URL shortener test cases pass.",
        marksAllocated: 30,
        targetFile: "main.py",
        validationPatterns: ["shorten_url", "resolve_code", "get_analytics", "json.dumps"],
      },
    ],
    files: [
      {
        name: "main.py",
        language: "python",
        content: `import sys
import json
from shortener_service import shorten_url, resolve_code
from analytics_store import get_analytics

# TODO: Route 'shorten', 'resolve', and 'analytics'
print(json.dumps({"ok": False, "error": "URL shortener not implemented"}))
`,
      },
      {
        name: "shortener_service.py",
        language: "python",
        content: `import hashlib
from analytics_store import LINKS

def shorten_url(long_url):
    # TODO: Validate http(s):// and generate 6-char sha256 short code
    return {"ok": False}

def resolve_code(code):
    # TODO: Lookup short code, increment clicks, return targetUrl
    return {"ok": False}
`,
      },
      {
        name: "analytics_store.py",
        language: "python",
        content: `LINKS = {
    "mz100a": {"url": "https://masteryzone.dev/coding", "clicks": 12},
    "mz200b": {"url": "https://masteryzone.dev/projects", "clicks": 5}
}

def get_analytics():
    # TODO: Return totalLinks, totalClicks, and topCode
    return {}
`,
      },
    ],
    solutionFiles: [
      {
        name: "main.py",
        language: "python",
        content: `import sys
import json
from shortener_service import shorten_url, resolve_code
from analytics_store import get_analytics

def main():
    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"ok": False, "error": "EMPTY_INPUT"}))
        return
    req = json.loads(raw)
    action = req.get("action", "")
    payload = req.get("payload", {})

    if action == "shorten":
        print(json.dumps(shorten_url(payload.get("url", ""))))
    elif action == "resolve":
        print(json.dumps(resolve_code(payload.get("code", ""))))
    elif action == "analytics":
        print(json.dumps({"ok": True, "analytics": get_analytics()}))
    else:
        print(json.dumps({"ok": False, "error": "UNKNOWN_ACTION"}))

if __name__ == "__main__":
    main()
`,
      },
      {
        name: "shortener_service.py",
        language: "python",
        content: `import hashlib
from analytics_store import LINKS

def shorten_url(long_url):
    clean = str(long_url or "").strip()
    if not (clean.startswith("http://") or clean.startswith("https://")) or len(clean) < 12:
        return {"ok": False, "error": "INVALID_URL"}
    code = hashlib.sha256(clean.encode("utf-8")).hexdigest()[:6]
    if code not in LINKS:
        LINKS[code] = {"url": clean, "clicks": 0}
    return {"ok": True, "shortCode": code, "url": clean}

def resolve_code(code):
    clean = str(code or "").strip()
    if clean not in LINKS:
        return {"ok": False, "error": "CODE_NOT_FOUND"}
    LINKS[clean]["clicks"] += 1
    return {
        "ok": True,
        "shortCode": clean,
        "targetUrl": LINKS[clean]["url"],
        "clicks": LINKS[clean]["clicks"]
    }
`,
      },
      {
        name: "analytics_store.py",
        language: "python",
        content: `LINKS = {
    "mz100a": {"url": "https://masteryzone.dev/coding", "clicks": 12},
    "mz200b": {"url": "https://masteryzone.dev/projects", "clicks": 5}
}

def get_analytics():
    total_links = len(LINKS)
    total_clicks = sum(v["clicks"] for v in LINKS.values())
    top_code = max(LINKS.items(), key=lambda kv: kv[1]["clicks"])[0] if LINKS else None
    return {
        "totalLinks": total_links,
        "totalClicks": total_clicks,
        "topCode": top_code
    }
`,
      },
    ],
    testCases: [
      {
        name: "Shorten valid HTTPS URL deterministically",
        input: '{"action":"shorten","payload":{"url":"https://docs.python.org/3/tutorial"}}',
        expectedOutput: '{"ok": true, "shortCode": "3b0ec8", "url": "https://docs.python.org/3/tutorial"}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Resolve existing short code mz100a and increment click count",
        input: '{"action":"resolve","payload":{"code":"mz100a"}}',
        expectedOutput: '{"ok": true, "shortCode": "mz100a", "targetUrl": "https://masteryzone.dev/coding", "clicks": 13}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Aggregate platform link click analytics",
        input: '{"action":"analytics","payload":{}}',
        expectedOutput: '{"ok": true, "analytics": {"totalLinks": 2, "totalClicks": 17, "topCode": "mz100a"}}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Resolve second seeded short code mz200b",
        input: '{"action":"resolve","payload":{"code":"mz200b"}}',
        expectedOutput: '{"ok": true, "shortCode": "mz200b", "targetUrl": "https://masteryzone.dev/projects", "clicks": 6}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Reject malformed URL without http/https scheme (Edge Case)",
        input: '{"action":"shorten","payload":{"url":"ftp://bad-link"}}',
        expectedOutput: '{"ok": false, "error": "INVALID_URL"}',
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Return CODE_NOT_FOUND for unknown short code (Edge Case)",
        input: '{"action":"resolve","payload":{"code":"unknown99"}}',
        expectedOutput: '{"ok": false, "error": "CODE_NOT_FOUND"}',
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },

  // =========================================================================
  // 14. NEW PROJECT 10: AI-Powered Document Question Answering System
  // =========================================================================
  {
    id: "proj_rag_doc_qa",
    title: "AI-Powered Document Question Answering System",
    category: "AI & Data Engineering",
    track: "Python",
    level: "Advanced",
    difficulty: "Advanced",
    starterLanguage: "python",
    technologies: ["Python", "FastAPI", "React", "Vector Search", "RAG Citations"],
    estimatedTime: "7 Hours",
    xpReward: 600,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Build a Retrieval-Augmented Generation (RAG) Document Question Answering System featuring document chunking, token-vector similarity retrieval, grounded answer synthesis, and verifiable source citations.",
    problemStatement:
      "Enterprise AI assistants must retrieve relevant passages from uploaded technical documents using vector/lexical similarity, synthesize grounded answers strictly from retrieved chunks, and attach exact document source citations while refusing to hallucinate when no document matches.",
    realWorldScenario:
      "You are building the document indexing, vector retrieval, and citation-grounded RAG pipeline for an AI knowledge base.",
    objectives: [
      "Store indexed document chunks with metadata and compute normalized token-overlap similarity scores in `vector_store.py`.",
      "Retrieve top matching chunks above relevance threshold (`score > 0`) and synthesize cited answers in `rag_pipeline.py`.",
      "Support dynamic document ingestion (`ingest_doc`) with empty-content validation.",
      "Return `NO_RELEVANT_CONTEXT` when a user query has zero overlap with the indexed knowledge base.",
    ],
    ioSpecification: {
      inputFormat: "JSON request on stdin: { action: 'query' | 'ingest', payload: {...} }",
      outputFormat: "JSON RAG response with synthesized answer, topCitationId, similarityScore, or ingestion status.",
    },
    deliverables: [
      "Document chunk store & similarity retriever (vector_store.py)",
      "Grounded RAG answer synthesizer & citation builder (rag_pipeline.py)",
      "RAG service entry point (main.py)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_rag_1", title: "Semantic / Token-Vector Similarity Retrieval", description: "Score indexed document chunks against query tokens (excluding stopwords) and rank descending.", mandatory: true, validationPatterns: ["retrieve_top_chunks", "STOPWORDS", "score"] },
      { id: "fr_rag_2", title: "Grounded Answer & Source Citation Generation", description: "Return top chunk content along with citation docId, title, and similarity score.", mandatory: true, validationPatterns: ["answer_question", "citation", "similarityScore"] },
      { id: "fr_rag_3", title: "Document Ingestion & Validation", description: "Allow ingesting new document chunks and reject empty text with EMPTY_DOCUMENT.", mandatory: true, validationPatterns: ["ingest_document", "EMPTY_DOCUMENT"] },
      { id: "fr_rag_4", title: "Hallucination Guard (No Context Match)", description: "Return NO_RELEVANT_CONTEXT when query matches no indexed document.", mandatory: true, validationPatterns: ["NO_RELEVANT_CONTEXT", "EMPTY_QUERY"] },
    ],
    technicalRequirements: [
      { id: "tr_rag_1", title: "Multi-File RAG Pipeline Architecture", constraint: "Separate vector/chunk index (vector_store.py), RAG synthesis (rag_pipeline.py), and router (main.py).", mandatory: true, validationPatterns: ["from vector_store import", "from rag_pipeline import"] },
      { id: "tr_rag_2", title: "Stopword Filtering in Tokenizer", constraint: "Filter common English stopwords so retrieval focuses on domain terms.", mandatory: true, validationPatterns: ["STOPWORDS"] },
      { id: "tr_rag_3", title: "Deterministic Similarity Rounding", constraint: "Round similarityScore to 2 decimal places.", mandatory: true, validationPatterns: ["round("] },
    ],
    milestones: [
      {
        id: "task_rag_1",
        stepNumber: 1,
        title: "Implement Document Chunk Index & Similarity Retriever",
        question: "Implement `tokenize(text)`, `ingest_document(doc_id, title, text)`, and `retrieve_top_chunks(query)` in `vector_store.py`.",
        expectedFunctionality: "Tokenizes text (removing stopwords), computes overlap similarity `|Q ∩ D| / |Q|`, and returns sorted chunks.",
        technicalConstraints: "Reject empty documents with `EMPTY_DOCUMENT`.",
        acceptanceCriteria: "Querying about PostgreSQL indexing retrieves `DOC-PG` with top relevance.",
        marksAllocated: 40,
        targetFile: "vector_store.py",
        validationPatterns: ["def tokenize", "def retrieve_top_chunks", "def ingest_document"],
      },
      {
        id: "task_rag_2",
        stepNumber: 2,
        title: "Build Citation-Grounded RAG Synthesizer",
        question: "Implement `answer_question(query)` in `rag_pipeline.py`.",
        expectedFunctionality: "Retrieves top chunk, formats grounded answer with citation metadata, or returns `NO_RELEVANT_CONTEXT`.",
        technicalConstraints: "Validate non-empty query string (`EMPTY_QUERY`).",
        acceptanceCriteria: "Returns `citation: 'DOC-PG'`, `similarityScore`, and grounded `answer`.",
        marksAllocated: 35,
        targetFile: "rag_pipeline.py",
        validationPatterns: ["def answer_question", "NO_RELEVANT_CONTEXT", "citation"],
      },
      {
        id: "task_rag_3",
        stepNumber: 3,
        title: "Wire RAG Service Controller in main.py",
        question: "Connect `vector_store.py` and `rag_pipeline.py` in `main.py`.",
        expectedFunctionality: "Routes `query` and `ingest` actions and outputs JSON.",
        technicalConstraints: "Handle malformed inputs cleanly.",
        acceptanceCriteria: "All 6 RAG document QA test cases pass.",
        marksAllocated: 25,
        targetFile: "main.py",
        validationPatterns: ["answer_question", "ingest_document", "json.dumps"],
      },
    ],
    files: [
      {
        name: "main.py",
        language: "python",
        content: `import sys
import json
from vector_store import ingest_document
from rag_pipeline import answer_question

# TODO: Route 'query' and 'ingest' actions
print(json.dumps({"ok": False, "error": "RAG Document QA system not implemented"}))
`,
      },
      {
        name: "vector_store.py",
        language: "python",
        content: `import re

STOPWORDS = {"the", "is", "a", "an", "in", "on", "of", "for", "to", "and", "how", "what", "does"}

DOCUMENTS = [
    {"id": "DOC-PG", "title": "PostgreSQL Indexing Guide", "text": "B-Tree indexes accelerate PostgreSQL range queries and equality lookups."},
    {"id": "DOC-REDIS", "title": "Redis Caching Architecture", "text": "Redis stores hot session keys in memory with configurable TTL expiration."},
    {"id": "DOC-JWT", "title": "JWT Security Spec", "text": "JSON Web Tokens sign authentication claims using HMAC SHA256."}
]

def tokenize(text):
    # TODO: Extract lowercase alphanumeric tokens excluding STOPWORDS
    return set()

def ingest_document(doc_id, title, text):
    # TODO: Validate and append new document chunk
    return {"ok": False}

def retrieve_top_chunks(query):
    # TODO: Score DOCUMENTS by token overlap with query and return sorted matches
    return []
`,
      },
      {
        name: "rag_pipeline.py",
        language: "python",
        content: `from vector_store import retrieve_top_chunks, tokenize

def answer_question(query):
    # TODO: Validate query, retrieve top chunk, and return cited answer or NO_RELEVANT_CONTEXT
    return {"ok": False}
`,
      },
    ],
    solutionFiles: [
      {
        name: "main.py",
        language: "python",
        content: `import sys
import json
from vector_store import ingest_document
from rag_pipeline import answer_question

def main():
    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"ok": False, "error": "EMPTY_INPUT"}))
        return
    req = json.loads(raw)
    action = req.get("action", "")
    payload = req.get("payload", {})

    if action == "query":
        print(json.dumps(answer_question(payload.get("question", ""))))
    elif action == "ingest":
        print(json.dumps(ingest_document(
            payload.get("id", ""),
            payload.get("title", ""),
            payload.get("text", "")
        )))
    else:
        print(json.dumps({"ok": False, "error": "UNKNOWN_ACTION"}))

if __name__ == "__main__":
    main()
`,
      },
      {
        name: "vector_store.py",
        language: "python",
        content: `import re

STOPWORDS = {"the", "is", "a", "an", "in", "on", "of", "for", "to", "and", "how", "what", "does"}

DOCUMENTS = [
    {"id": "DOC-PG", "title": "PostgreSQL Indexing Guide", "text": "B-Tree indexes accelerate PostgreSQL range queries and equality lookups."},
    {"id": "DOC-REDIS", "title": "Redis Caching Architecture", "text": "Redis stores hot session keys in memory with configurable TTL expiration."},
    {"id": "DOC-JWT", "title": "JWT Security Spec", "text": "JSON Web Tokens sign authentication claims using HMAC SHA256."}
]

def tokenize(text):
    words = re.findall(r"[a-z0-9]+", str(text or "").lower())
    return {w for w in words if w not in STOPWORDS}

def ingest_document(doc_id, title, text):
    clean_text = str(text or "").strip()
    clean_id = str(doc_id or "").strip()
    clean_title = str(title or "").strip()
    if not clean_id or not clean_title or not clean_text:
        return {"ok": False, "error": "EMPTY_DOCUMENT"}
    DOCUMENTS.append({"id": clean_id, "title": clean_title, "text": clean_text})
    return {"ok": True, "ingestedId": clean_id, "totalDocs": len(DOCUMENTS)}

def retrieve_top_chunks(query):
    q_tokens = tokenize(query)
    if not q_tokens:
        return []
    scored = []
    for doc in DOCUMENTS:
        d_tokens = tokenize(doc["text"] + " " + doc["title"])
        overlap = len(q_tokens.intersection(d_tokens))
        if overlap > 0:
            score = round(overlap / len(q_tokens), 2)
            scored.append({"doc": doc, "score": score})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored
`,
      },
      {
        name: "rag_pipeline.py",
        language: "python",
        content: `from vector_store import retrieve_top_chunks, tokenize

def answer_question(query):
    if not query or not tokenize(query):
        return {"ok": False, "error": "EMPTY_QUERY"}
    matches = retrieve_top_chunks(query)
    if not matches:
        return {"ok": False, "error": "NO_RELEVANT_CONTEXT"}
    best = matches[0]
    doc = best["doc"]
    return {
        "ok": True,
        "answer": doc["text"],
        "citation": doc["id"],
        "sourceTitle": doc["title"],
        "similarityScore": best["score"]
    }
`,
      },
    ],
    testCases: [
      {
        name: "Retrieve cited answer for PostgreSQL B-Tree indexing query",
        input: '{"action":"query","payload":{"question":"How do B-Tree indexes accelerate PostgreSQL queries?"}}',
        expectedOutput: '{"ok": true, "answer": "B-Tree indexes accelerate PostgreSQL range queries and equality lookups.", "citation": "DOC-PG", "sourceTitle": "PostgreSQL Indexing Guide", "similarityScore": 0.86}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Retrieve cited answer for Redis memory TTL expiration query",
        input: '{"action":"query","payload":{"question":"What does Redis store in memory with TTL?"}}',
        expectedOutput: '{"ok": true, "answer": "Redis stores hot session keys in memory with configurable TTL expiration.", "citation": "DOC-REDIS", "sourceTitle": "Redis Caching Architecture", "similarityScore": 0.8}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Ingest new vector document chunk into knowledge base",
        input: '{"action":"ingest","payload":{"id":"DOC-K8S","title":"Kubernetes Pods","text":"Pods are the smallest deployable units in Kubernetes clusters."}}',
        expectedOutput: '{"ok": true, "ingestedId": "DOC-K8S", "totalDocs": 4}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Retrieve cited answer for JWT HMAC authentication query",
        input: '{"action":"query","payload":{"question":"JWT authentication claims HMAC SHA256"}}',
        expectedOutput: '{"ok": true, "answer": "JSON Web Tokens sign authentication claims using HMAC SHA256.", "citation": "DOC-JWT", "sourceTitle": "JWT Security Spec", "similarityScore": 1.0}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Refuse to hallucinate when query has zero overlap with knowledge base (Edge Case)",
        input: '{"action":"query","payload":{"question":"Quantum biology photosynthesis chloroplasts"}}',
        expectedOutput: '{"ok": false, "error": "NO_RELEVANT_CONTEXT"}',
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Reject empty document ingestion with EMPTY_DOCUMENT (Edge Case)",
        input: '{"action":"ingest","payload":{"id":"DOC-EMPTY","title":"Blank","text":"   "}}',
        expectedOutput: '{"ok": false, "error": "EMPTY_DOCUMENT"}',
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },
];

module.exports = { PROJECTS_PART_2 };
