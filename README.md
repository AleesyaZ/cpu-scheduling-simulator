# cpu-scheduling-simulator

A web-based Mini Operating System simulator that demonstrates how different CPU scheduling algorithms work. This project was developed for the **CSN4224 Operating System** course.

**🔗 Live Demo:** [View the Simulator Here](https://aleesyaz.github.io/cpu-scheduling-simulator/)

## Features
*   **Dynamic Input:** Add between 3 to 10 processes dynamically.
*   **Customizable Parameters:** Users can input custom Arrival Times, Burst Times, and Priorities.
*   **Visual Gantt Chart:** Automatically generates a proportional, color-coded Gantt chart.
*   **Time Calculations:** Automatically calculates the individual and Average Waiting Time for all processes.

## Algorithms Supported
This simulator includes both preemptive and non-preemptive scheduling algorithms:
1.  **First-Come-First-Served (FCFS)**
2.  **Preemptive Shortest Job First (SJF / SRT)**
3.  **Non-Preemptive Priority**
4.  **Round Robin (Time Quantum = 3)**

## Built With
*   **HTML5** - Structure and layout.
*   **CSS3** - Styling, Flexbox for the Gantt Chart.
*   **Vanilla JavaScript (ES6)** - Object-Oriented logic and algorithm calculations.


## How to Run Locally
1. Clone this repository: `git clone https://github.com/AleesyaZ/cpu-scheduling-simulator.git`
2. Open the folder.
3. Double-click `index.html` to open it in any modern web browser. No server or installation required!
