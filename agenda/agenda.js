const WEEKDAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
];

function getWeekRange(baseDate = new Date()) {
  const sunday = new Date(baseDate);
  sunday.setHours(0, 0, 0, 0);
  sunday.setDate(sunday.getDate() - sunday.getDay());

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  return { sunday, saturday };
}

function formatDateBR(date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getDateKeyLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseMinutes(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return (hours * 60) + minutes;
}

function buildFallbackEvents(sunday) {
  const wednesday = new Date(sunday);
  wednesday.setDate(sunday.getDate() + 3);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  return [
    {
      date: sunday.toISOString(),
      time: "19:45",
      title: "Culto de Domingo"
    },
    {
      date: wednesday.toISOString(),
      time: "19:45",
      title: "Culto de Quarta"
    },
    {
      date: saturday.toISOString(),
      time: "08:15",
      title: "Escola Sabatina"
    }
  ];
}

function groupEventsByDay(events) {
  const grouped = new Map();

  for (const event of events) {
    const eventDate = new Date(event.date);
    const key = getDateKeyLocal(eventDate);

    if (!grouped.has(key)) {
      grouped.set(key, {
        date: eventDate,
        events: []
      });
    }

    grouped.get(key).events.push(event);
  }

  const sortedDays = Array.from(grouped.values())
    .sort((left, right) => left.date - right.date)
    .map((dayGroup) => {
      dayGroup.events.sort((left, right) => parseMinutes(left.time) - parseMinutes(right.time));
      return dayGroup;
    });

  return sortedDays;
}

function createAgendaTable(dayGroup) {
  const row = document.createElement("div");
  row.className = "row align-items-center";

  const column = document.createElement("div");
  column.className = "col d-grid gap-2 col-lg-4 mx-auto";

  const textStart = document.createElement("div");
  textStart.className = "text-start";

  const table = document.createElement("table");
  table.className = "table caption-top";

  const caption = document.createElement("caption");
  const dayNumber = String(dayGroup.date.getDate()).padStart(2, "0");
  const weekdayName = WEEKDAY_NAMES[dayGroup.date.getDay()];
  caption.textContent = `${dayNumber} | ${weekdayName}`;

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  const thTime = document.createElement("th");
  thTime.className = "text-primary-emphasis align-middle";
  thTime.scope = "col";

  const thEvent = document.createElement("th");
  thEvent.className = "text-primary-emphasis";
  thEvent.scope = "col";

  headRow.appendChild(thTime);
  headRow.appendChild(thEvent);
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");

  dayGroup.events.forEach((eventItem) => {
    const tr = document.createElement("tr");

    const tdTime = document.createElement("td");
    tdTime.className = "p-1 fs-5 text-center text-bg-dark align-middle time-col";
    tdTime.textContent = eventItem.time;

    const tdTitle = document.createElement("td");
    tdTitle.className = "fs-6";
    tdTitle.textContent = eventItem.title;

    tr.appendChild(tdTime);
    tr.appendChild(tdTitle);
    tbody.appendChild(tr);
  });

  table.appendChild(caption);
  table.appendChild(thead);
  table.appendChild(tbody);

  textStart.appendChild(table);
  column.appendChild(textStart);
  row.appendChild(column);

  return row;
}

function renderAgenda(events, sunday, saturday) {
  const periodElement = document.getElementById("agenda-periodo");
  const contentElement = document.getElementById("agenda-content");

  periodElement.textContent = `${formatDateBR(sunday)} a ${formatDateBR(saturday)}`;
  contentElement.innerHTML = "";

  const groupedDays = groupEventsByDay(events);
  groupedDays.forEach((dayGroup) => {
    contentElement.appendChild(createAgendaTable(dayGroup));
  });
}

function filterEventsForCurrentWeek(events, sunday, saturday) {
  return events.filter((eventItem) => {
    const eventDate = new Date(eventItem.date);
    return eventDate >= sunday && eventDate <= saturday;
  });
}

async function loadAgenda() {
  const { sunday, saturday } = getWeekRange();

  try {
    const response = await fetch("../assets/agenda.json");
    if (!response.ok) {
      throw new Error("Falha ao carregar agenda.json");
    }

    const agendaData = await response.json();
    const allEvents = Array.isArray(agendaData) ? agendaData : (agendaData.events || []);

    const currentWeekEvents = filterEventsForCurrentWeek(allEvents, sunday, saturday);
    const eventsToRender = currentWeekEvents.length > 0 ? currentWeekEvents : buildFallbackEvents(sunday);

    renderAgenda(eventsToRender, sunday, saturday);
  } catch (error) {
    const fallbackEvents = buildFallbackEvents(sunday);
    renderAgenda(fallbackEvents, sunday, saturday);
  }
}

window.addEventListener("load", loadAgenda);
