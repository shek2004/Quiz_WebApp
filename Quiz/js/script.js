// Retrieve users, quizzes, results, and currentUser from localStorage
let users = JSON.parse(localStorage.getItem("users")) || [];
let quizzes = JSON.parse(localStorage.getItem("quizzes")) || [];
let results = JSON.parse(localStorage.getItem("results")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let timer; // Global timer variable

// Initialize app functionality
document.addEventListener("DOMContentLoaded", () => {
  if (currentUser) {
    if (currentUser.role === "teacher") {
      teacherFeatures();
    } else if (currentUser.role === "student") {
      studentFeatures();
    }
  }
  handleLogin();
  handleSignup();
  handleLogout();
});

// Function to handle login
function handleLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const role = document.getElementById("role")?.value;
    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!role || !username || !password) {
      alert("All fields are required!");
      return;
    }

    const user = users.find(
      (user) =>
        user.username === username &&
        user.password === password &&
        user.role === role
    );

    if (user) {
      alert(`Login successful as ${role}!`);
      localStorage.setItem("currentUser", JSON.stringify({ username, role }));
      window.location.href =
        role === "teacher"
          ? "teacher_dashboard.html"
          : "student_dashboard.html";
    } else {
      alert("Invalid credentials or role mismatch.");
    }
  });
}

// Function to handle signup
function handleSignup() {
  const signupLink = document.getElementById("signupLink");
  if (!signupLink) return;

  signupLink.addEventListener("click", (e) => {
    e.preventDefault();

    const role = prompt("Enter your role (teacher/student):").toLowerCase();
    const username = prompt("Enter a username:");
    const password = prompt("Enter a password:");

    if (
      !role ||
      !username ||
      !password ||
      (role !== "teacher" && role !== "student")
    ) {
      alert(
        "All fields are required, and the role must be 'teacher' or 'student'."
      );
      return;
    }

    if (users.some((user) => user.username === username)) {
      alert("Username already exists. Try a different one.");
      return;
    }

    users.push({ username, password, role });
    localStorage.setItem("users", JSON.stringify(users));
    alert("Signup successful! You can now log in.");
  });
}

// Function to handle logout
function handleLogout() {
  const logoutButton = document.getElementById("logout");
  if (!logoutButton) return;

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    alert("Logged out successfully!");
    window.location.href = "login.html";
  });
}

// Teacher-Specific Features
function teacherFeatures() {
  if (!currentUser || currentUser.role !== "teacher") {
    alert("Unauthorized access. Redirecting to login.");
    handleLogout();
    return;
  }

  renderQuizzes();

  const welcomeMessage = document.getElementById("welcomeMessage");
  if (welcomeMessage) {
    welcomeMessage.textContent = `Welcome, ${currentUser.username}!`;
  }

  document.getElementById("createQuiz")?.addEventListener("click", () => {
    const quizTitle = prompt("Enter Quiz Title:");
    const quizCode = prompt(
      "Enter a unique code for this quiz (e.g., 'MATH101'):"
    );
    const timeLimit = prompt("Enter the time limit for the quiz (in minutes):");

    if (
      !quizTitle ||
      !quizCode ||
      !timeLimit ||
      isNaN(timeLimit) ||
      timeLimit <= 0
    ) {
      alert("Please provide valid quiz details.");
      return;
    }

    if (quizzes.some((quiz) => quiz.code === quizCode)) {
      alert("This quiz code already exists. Please choose another code.");
      return;
    }

    quizzes.push({
      title: quizTitle,
      code: quizCode,
      timeLimit: parseInt(timeLimit), // Store the time limit in minutes
      questions: [],
      createdBy: currentUser.username,
    });
    localStorage.setItem("quizzes", JSON.stringify(quizzes));
    alert("Quiz created successfully!");
    renderQuizzes();
  });

  function renderQuizzes() {
    const quizList = document.getElementById("quizList");
    if (!quizList) return;

    quizList.innerHTML = quizzes
      .filter((quiz) => quiz.createdBy === currentUser.username)
      .map(
        (quiz, index) => `
          <li>
            ${quiz.title} (Code: ${quiz.code}) - Time Limit: ${quiz.timeLimit} min
            <button onclick="addQuestions(${index})">Add Questions</button>
            <button onclick="deleteQuiz(${index})">Delete Quiz</button>
          </li>`
      )
      .join("");
  }

  window.addQuestions = function (quizIndex) {
    const questionText = prompt("Enter Question:");
    const options = prompt("Enter Options (comma-separated):").split(",");
    const correctAnswer = prompt("Enter Correct Answer:");
    if (questionText && options.length && correctAnswer) {
      quizzes[quizIndex].questions.push({
        questionText,
        options,
        correctAnswer,
      });
      localStorage.setItem("quizzes", JSON.stringify(quizzes));
      alert("Question added!");
    } else {
      alert("All fields are required to add a question.");
    }
  };

  window.deleteQuiz = function (quizIndex) {
    if (confirm("Are you sure you want to delete this quiz?")) {
      quizzes.splice(quizIndex, 1);
      localStorage.setItem("quizzes", JSON.stringify(quizzes));
      renderQuizzes();
      alert("Quiz deleted successfully.");
    }
  };
}

// Student-Specific Features
function studentFeatures() {
  if (!currentUser || currentUser.role !== "student") {
    alert("Unauthorized access. Redirecting to login.");
    handleLogout();
    return;
  }

  renderAvailableQuizzes();

  const welcomeMessage = document.getElementById("welcomeMessage");
  if (welcomeMessage) {
    welcomeMessage.textContent = `Welcome, ${currentUser.username}!`;
  }

  function renderAvailableQuizzes() {
    const quizCodeInput = prompt("Enter the quiz code given by your teacher:");

    if (!quizCodeInput) {
      alert("Quiz code is required.");
      return;
    }

    const quiz = quizzes.find((quiz) => quiz.code === quizCodeInput);

    if (!quiz) {
      alert("No quiz found with this code.");
      return;
    }

    const availableQuizzes = document.getElementById("availableQuizzes");
    if (!availableQuizzes) return;

    availableQuizzes.innerHTML = `
      <li>
        ${quiz.title} 
        <button onclick="attemptQuiz(${quizzes.indexOf(
          quiz
        )})">Attempt Quiz</button>
      </li>
    `;
  }

  window.attemptQuiz = function (quizIndex) {
    const quiz = quizzes[quizIndex];
    if (!quiz) return;

    // Stop any previously running timer
    clearInterval(timer);

    // Show the timer and quiz container
    const timerDisplay = document.getElementById("timerDisplay");
    const quizContainer = document.getElementById("quizContainer");
    timerDisplay.style.display = "block";
    quizContainer.style.display = "block";

    // Start the timer
    let timeRemaining = quiz.timeLimit * 60; // Convert minutes to seconds
    timer = setInterval(() => {
      timeRemaining--;
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      timerDisplay.textContent = `Time Remaining: ${minutes}:${
        seconds < 10 ? "0" : ""
      }${seconds}`;

      if (timeRemaining <= 0) {
        clearInterval(timer);
        alert("Time's up! Submitting your quiz.");
        submitQuiz(quiz, quizIndex);
      }
    }, 1000);

    // Render the quiz questions
    renderQuestions(quiz.questions);

    // Attach event listener to the Submit button
    const submitQuizButton = document.getElementById("submitQuizButton");
    submitQuizButton.onclick = () => {
      clearInterval(timer); // Stop the timer on manual submission
      submitQuiz(quiz, quizIndex);
    };
  };

  function renderQuestions(questions) {
    const quizQuestions = document.getElementById("quizQuestions");
    quizQuestions.innerHTML = questions
      .map(
        (question, qIndex) => `
        <div>
          <p>${qIndex + 1}. ${question.questionText}</p>
          ${question.options
            .map(
              (option) => `
              <label>
                <input type="radio" name="question-${qIndex}" value="${option}">
                ${option}
              </label>`
            )
            .join("")}
        </div>`
      )
      .join("");
  }

  function submitQuiz(quiz, quizIndex) {
    const studentAnswers = [];
    let allAnswered = true;

    quiz.questions.forEach((_, index) => {
      const selectedOption = document.querySelector(
        `input[name="question-${index}"]:checked`
      );
      studentAnswers.push(selectedOption ? selectedOption.value : null);
      if (!selectedOption) allAnswered = false;
    });

    if (!allAnswered) {
      alert("Please answer all questions before submitting!");
      return;
    }

    let score = 0;
    quiz.questions.forEach((question, index) => {
      if (question.correctAnswer === studentAnswers[index]) score++;
    });

    alert(`You scored ${score}/${quiz.questions.length}`);
    results.push({
      student: currentUser.username,
      quizTitle: quiz.title,
      score,
    });
    localStorage.setItem("results", JSON.stringify(results));

    // Hide the quiz container after submission
    const quizContainer = document.getElementById("quizContainer");
    quizContainer.style.display = "none";
    const timerDisplay = document.getElementById("timerDisplay");
    timerDisplay.style.display = "none";
  }
}
