(function () {
  "use strict";

  var rowsContainer = document.getElementById("category-rows");
  var addRowBtn = document.getElementById("add-row");
  var calcBtn = document.getElementById("calculate-btn");
  var targetInput = document.getElementById("target-grade");

  var rowCount = 0;

  var DEFAULT_ROWS = [
    { name: "Homework", weight: 20, mode: "pct", scores: "90" },
    { name: "Quizzes", weight: 20, mode: "pct", scores: "85" },
    { name: "Tests", weight: 30, mode: "pct", scores: "78" },
    { name: "Final Exam", weight: 30, mode: "pct", scores: "" }
  ];

  function createRow(data) {
    rowCount++;
    var id = "row-" + rowCount;
    var wrap = document.createElement("div");
    wrap.className = "category-row";
    wrap.dataset.rowId = id;

    wrap.innerHTML =
      '<div class="cell-name"><input type="text" class="f-name" placeholder="e.g. Homework" value="' + escapeHtml(data.name || "") + '"></div>' +
      '<div class="cell-weight"><input type="number" class="f-weight" placeholder="20" min="0" max="100" step="0.1" value="' + (data.weight != null ? data.weight : "") + '"></div>' +
      '<div class="cell-mode"><select class="f-mode">' +
        '<option value="pct"' + (data.mode === "pct" ? " selected" : "") + '>%</option>' +
        '<option value="pts"' + (data.mode === "pts" ? " selected" : "") + '>pts</option>' +
      '</select></div>' +
      '<div class="cell-scores"><input type="text" class="f-scores" placeholder="90, 85, 92" value="' + escapeHtml(data.scores || "") + '"></div>' +
      '<div class="cell-drop drop-lowest-cell"><input type="checkbox" class="f-drop" aria-label="Drop lowest score"></div>' +
      '<div class="cell-remove"><button type="button" class="remove-row" aria-label="Remove category">&times;</button></div>';

    wrap.querySelector(".remove-row").addEventListener("click", function () {
      wrap.remove();
      updateWeightMeter();
    });

    var modeSel = wrap.querySelector(".f-mode");
    var scoresInput = wrap.querySelector(".f-scores");
    function syncPlaceholder() {
      scoresInput.placeholder = modeSel.value === "pts" ? "42/50, 45/50" : "90, 85, 92";
    }
    modeSel.addEventListener("change", syncPlaceholder);
    syncPlaceholder();

    wrap.querySelector(".f-weight").addEventListener("input", updateWeightMeter);

    rowsContainer.appendChild(wrap);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  DEFAULT_ROWS.forEach(createRow);

  addRowBtn.addEventListener("click", function () {
    createRow({ name: "", weight: "", mode: "pct", scores: "" });
    updateWeightMeter();
  });

  function updateWeightMeter() {
    var rows = rowsContainer.querySelectorAll(".category-row");
    var total = 0;
    rows.forEach(function (row) {
      var w = parseFloat(row.querySelector(".f-weight").value);
      if (!isNaN(w)) total += w;
    });
    var label = document.getElementById("weight-total-label");
    var fill = document.getElementById("weight-fill");
    label.textContent = "Total weight: " + roundClean(total) + "%";
    var pct = Math.min(total, 100);
    fill.style.width = pct + "%";
    fill.classList.remove("complete", "over");
    if (Math.abs(total - 100) < 0.01) fill.classList.add("complete");
    else if (total > 100) fill.classList.add("over");
    return total;
  }

  function roundClean(n) {
    return Math.round(n * 100) / 100;
  }

  function parseScores(raw, mode) {
    if (!raw || !raw.trim()) return [];
    var parts = raw.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var values = [];
    parts.forEach(function (p) {
      if (mode === "pts") {
        var m = p.match(/^(-?\d+(\.\d+)?)\s*\/\s*(-?\d+(\.\d+)?)$/);
        if (m) {
          var earned = parseFloat(m[1]);
          var possible = parseFloat(m[3]);
          if (possible > 0) values.push((earned / possible) * 100);
        }
      } else {
        var v = parseFloat(p);
        if (!isNaN(v)) values.push(v);
      }
    });
    return values;
  }

  function letterGrade(pct) {
    if (pct >= 90) return "A";
    if (pct >= 80) return "B";
    if (pct >= 70) return "C";
    if (pct >= 60) return "D";
    return "F";
  }

  function calculate() {
    var rows = rowsContainer.querySelectorAll(".category-row");
    var totalWeight = 0;
    var gradedWeight = 0;
    var contribution = 0;
    var ungraded = [];
    var hasAnyRow = rows.length > 0;

    rows.forEach(function (row) {
      var name = row.querySelector(".f-name").value.trim() || "Category";
      var weight = parseFloat(row.querySelector(".f-weight").value);
      var mode = row.querySelector(".f-mode").value;
      var scoresRaw = row.querySelector(".f-scores").value;
      var dropLowest = row.querySelector(".f-drop").checked;

      if (isNaN(weight) || weight <= 0) return;
      totalWeight += weight;

      var scores = parseScores(scoresRaw, mode);
      if (scores.length === 0) {
        ungraded.push({ name: name, weight: weight });
        return;
      }

      if (dropLowest && scores.length > 1) {
        var minIdx = scores.indexOf(Math.min.apply(null, scores));
        scores = scores.slice(0, minIdx).concat(scores.slice(minIdx + 1));
      }

      var avg = scores.reduce(function (a, b) { return a + b; }, 0) / scores.length;
      gradedWeight += weight;
      contribution += (weight / 100) * avg;
    });

    var remainingWeight = totalWeight - gradedWeight;
    var currentGradeOnGraded = gradedWeight > 0 ? (contribution / (gradedWeight / 100)) : null;

    // Update weight warning
    var weightWarning = document.getElementById("weight-warning");
    if (hasAnyRow && Math.abs(totalWeight - 100) > 0.5) {
      weightWarning.hidden = false;
    } else {
      weightWarning.hidden = true;
    }

    // Stamp
    var stamp = document.getElementById("stamp");
    var stampLetter = document.getElementById("stamp-letter");
    var stampPct = document.getElementById("stamp-pct");

    if (currentGradeOnGraded === null) {
      stampLetter.textContent = "—";
      stampPct.textContent = "Enter scores";
    } else {
      stampLetter.textContent = letterGrade(currentGradeOnGraded);
      stampPct.textContent = roundClean(currentGradeOnGraded) + "%";
    }
    stamp.classList.remove("stamped");
    // eslint-disable-next-line no-unused-expressions
    void stamp.offsetWidth;
    stamp.classList.add("stamped");

    // Details
    document.getElementById("detail-graded-weight").textContent = roundClean(gradedWeight) + "% of course";
    document.getElementById("detail-contribution").textContent = roundClean(contribution) + " pts (out of " + roundClean(totalWeight) + ")";
    document.getElementById("detail-remaining").textContent = roundClean(remainingWeight) + "% of course";

    // Remaining note in target block
    var remainingNote = document.getElementById("remaining-note");
    if (ungraded.length === 0) {
      remainingNote.textContent = remainingWeight > 0 ? "Some weight is unassigned to any category" : "No ungraded categories — grade is final";
    } else {
      remainingNote.textContent = "Ungraded: " + ungraded.map(function (u) { return u.name + " (" + roundClean(u.weight) + "%)"; }).join(", ");
    }

    // Required score
    var target = parseFloat(targetInput.value);
    var requiredBox = document.getElementById("required-box");
    var requiredScore = document.getElementById("required-score");
    var requiredSub = document.getElementById("required-sub");

    if (!isNaN(target) && remainingWeight > 0) {
      var required = (target - contribution) / (remainingWeight / 100);
      requiredBox.hidden = false;
      if (required > 100) {
        requiredScore.textContent = roundClean(required) + "%";
        requiredSub.textContent = "That's above 100% — this target may not be reachable on the remaining " + roundClean(remainingWeight) + "% of your grade.";
      } else if (required < 0) {
        requiredScore.textContent = "0%";
        requiredSub.textContent = "You've already secured this target based on graded work.";
      } else {
        requiredScore.textContent = roundClean(required) + "%";
        requiredSub.textContent = "on the remaining " + roundClean(remainingWeight) + "% of your grade (e.g. " + (ungraded[0] ? ungraded[0].name : "final exam") + ").";
      }
    } else {
      requiredBox.hidden = true;
    }
  }

  calcBtn.addEventListener("click", calculate);
  targetInput.addEventListener("input", calculate);
  rowsContainer.addEventListener("input", updateWeightMeter);

  // initial state
  updateWeightMeter();
  calculate();

  // ---------------- Accordion ----------------
  document.querySelectorAll(".acc-trigger").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".acc-item");
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".acc-item.open").forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove("open");
          openItem.querySelector(".acc-trigger").setAttribute("aria-expanded", "false");
        }
      });
      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });
  });
})();