let currentChallengeId = null;

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

const DOM = {
  left: {
    option: document.querySelector("#left-option"),
    image: document.querySelector("#left-image"),
    loader: document.querySelector("#left-loader"),
    label: document.querySelector("#left-label"),
    percentage: document.querySelector("#left-percentage"),
    button: document.querySelector("#btn-left"),
  },
  right: {
    option: document.querySelector("#right-option"),
    image: document.querySelector("#right-image"),
    loader: document.querySelector("#right-loader"),
    label: document.querySelector("#right-label"),
    percentage: document.querySelector("#right-percentage"),
    button: document.querySelector("#btn-right"),
  },
  nextButton: document.querySelector("#next-button"),
};

const updateImage = async (side, newSrc) => {
  const { image, loader } = DOM[side];

  image.classList.remove("loaded");
  loader.classList.remove("hidden");

  try {
    console.log(newSrc);
    await preloadImage(newSrc);
    image.src = newSrc;
    image.classList.add("loaded");
    loader.classList.add("hidden");
  } catch {
    image.src = "/images/error.jpg";
    image.classList.add("loaded");
    loader.classList.add("hidden");
  }
};

const fetchCurrentChallenge = async () => {
  try {
    const data = await fetch("/api/challenges/current").then((r) => r.json());
    console.log(data);

    if (!data?.id) throw new Error("No challenge found");

    currentChallengeId = data.id;

    const resetUI = () => {
      ["left", "right"].forEach((side) => {
        const { option, percentage, label, button } = DOM[side];
        option.classList.remove("voted", "loser");
        option.style.flex = "1";
        percentage.textContent = "";
        label.textContent = data[`${side}_label`];
        button.style.display = "inline-block";
      });
      DOM.nextButton.classList.remove("visible");
    };

    resetUI();

    await Promise.all([
      updateImage("left", data.left_img_url),
      updateImage("right", data.right_img_url),
    ]);
  } catch (error) {
    console.error("Error fetching challenge:", error);
  }
};

const vote = async (choice) => {
  if (!currentChallengeId) return;

  const toggleButtons = (display) => {
    DOM.left.button.style.display = display;
    DOM.right.button.style.display = display;
  };

  try {
    toggleButtons("none");

    const { leftVotes, rightVotes } = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: currentChallengeId, choice }),
    }).then((r) => r.json());

    displayResults(leftVotes, rightVotes);
  } catch (error) {
    console.error("Error voting:", error);
    toggleButtons("inline-block");
  }
};

const displayResults = (leftVotes, rightVotes) => {
  const total = leftVotes + rightVotes;
  const getPercent = (votes) => (total ? Math.round((votes / total) * 100) : 0);

  const leftPercent = getPercent(leftVotes);
  const rightPercent = getPercent(rightVotes);

  ["left", "right"].forEach((side) => {
    const { option, percentage } = DOM[side];
    const percent = side === "left" ? leftPercent : rightPercent;

    option.classList.add("voted");
    percentage.textContent = `${percent}%`;
    option.style.flex = `${percent}`;
  });

  if (leftPercent !== rightPercent) {
    DOM[leftPercent < rightPercent ? "left" : "right"].option.classList.add(
      "loser"
    );
  }

  DOM.nextButton.classList.add("visible");
};

document.addEventListener("DOMContentLoaded", () => {
  fetchCurrentChallenge();
  DOM.left.button.addEventListener("click", () => vote("left"));
  DOM.right.button.addEventListener("click", () => vote("right"));
  DOM.nextButton.addEventListener("click", fetchCurrentChallenge);
});
