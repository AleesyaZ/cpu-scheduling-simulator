class Process {
    constructor(id, arrivalTime, burstTime, priority) {
        this.id = id;                     
        this.arrivalTime = arrivalTime;   // for user to input
        this.burstTime = burstTime;       // for user to input
        this.priority = priority;         // for user to input

        // tracking variables for algorithms
        this.remainingTime = burstTime;   // needed for Preemptive SJF and RR
        this.completionTime = 0;          
        this.turnaroundTime = 0;          // turnaround time = completion - arrival
        this.waitingTime = 0;             // waiting time = turnaround - burst
    }
}

function runFCFS(processes) {
    // 1. sort processes strictly by arrival time
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    let currentTime = 0;
    let ganttChart = []; 

    processes.forEach(p => {
        // if the CPU is idle waiting for the next process to arrive
        if (currentTime < p.arrivalTime) {
            ganttChart.push({ id: "Idle", start: currentTime, end: p.arrivalTime });
            currentTime = p.arrivalTime;
        }

        let startTime = currentTime;
        currentTime += p.burstTime; // CPU processes the job
        p.completionTime = currentTime;
        
        // OS formulas for calculating turnaround and waiting times
        p.turnaroundTime = p.completionTime - p.arrivalTime;
        p.waitingTime = p.turnaroundTime - p.burstTime;

        // save block for Gantt Chart
        ganttChart.push({ id: p.id, start: startTime, end: p.completionTime });
    });

    // calculate average waiting time
    let totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
    let avgWaitingTime = totalWaitingTime / processes.length;

    return { 
        processes: processes, 
        ganttChart: ganttChart, 
        avgWaitingTime: avgWaitingTime 
    };
}

function runNonPreemptivePriority(processes) {
    // flag to track which processes have finished
    processes.forEach(p => p.isCompleted = false);
    
    let currentTime = 0;
    let completedCount = 0;
    let ganttChart = [];
    const n = processes.length;

    while (completedCount < n) {
        // find all processes that have arrived by 'currentTime' AND are not completed yet
        let availableProcesses = processes.filter(p => p.arrivalTime <= currentTime && !p.isCompleted);

        if (availableProcesses.length > 0) {
            // sort by priority (smallest integer = highest priority)
            // if priorities are a tie, we sort by arrival time (FCFS)
            availableProcesses.sort((a, b) => {
                if (a.priority === b.priority) {
                    return a.arrivalTime - b.arrivalTime; 
                }
                return a.priority - b.priority;
            });

            // pick highest priority process
            let selectedProcess = availableProcesses[0];
            let startTime = currentTime;
            
            // process runs to completion (Non-Preemptive)
            currentTime += selectedProcess.burstTime;
            
            // calculate times
            selectedProcess.completionTime = currentTime;
            selectedProcess.turnaroundTime = selectedProcess.completionTime - selectedProcess.arrivalTime;
            selectedProcess.waitingTime = selectedProcess.turnaroundTime - selectedProcess.burstTime;
            selectedProcess.isCompleted = true;

            // save to Gantt Chart
            ganttChart.push({ id: selectedProcess.id, start: startTime, end: currentTime });
            
            completedCount++;
        } else {
            // if no processes have arrived yet, the CPU is IDLE
            // find the next upcoming process and jump the time forward
            let futureProcesses = processes.filter(p => !p.isCompleted).sort((a, b) => a.arrivalTime - b.arrivalTime);
            let nextArrivalTime = futureProcesses[0].arrivalTime;
            
            ganttChart.push({ id: "Idle", start: currentTime, end: nextArrivalTime });
            currentTime = nextArrivalTime;
        }
    }

    // calculate average waiting time
    let totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
    let avgWaitingTime = totalWaitingTime / processes.length;

    return { 
        processes: processes, 
        ganttChart: ganttChart, 
        avgWaitingTime: avgWaitingTime 
    };
}

function runRoundRobin(processes, quantum) {
    // reset properties for simulation
    processes.forEach(p => {
        p.remainingTime = p.burstTime; 
        p.isCompleted = false;
    });
    
    let currentTime = 0;
    let completedCount = 0;
    let ganttChart = [];
    let readyQueue = [];
    const n = processes.length;
    
    // sort processes strictly by arrival time initially
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    let processIndex = 0; 
    
    // push the first arrived process into the queue
    while (processIndex < n && processes[processIndex].arrivalTime <= currentTime) {
        readyQueue.push(processes[processIndex]);
        processIndex++;
    }
    
    // if the queue is empty at time 0, jump forward
    if (readyQueue.length === 0 && processIndex < n) {
        currentTime = processes[processIndex].arrivalTime;
        ganttChart.push({ id: "Idle", start: 0, end: currentTime });
        while (processIndex < n && processes[processIndex].arrivalTime <= currentTime) {
            readyQueue.push(processes[processIndex]);
            processIndex++;
        }
    }

    // main Round Robin loop
    while (completedCount < n) {
        if (readyQueue.length > 0) {
            let currentProcess = readyQueue.shift(); // remove from front of queue
            
            // it runs for either its remaining time OR the quantum, whichever is smaller
            let timeSpent = Math.min(currentProcess.remainingTime, quantum);
            let startTime = currentTime;
            currentTime += timeSpent;
            currentProcess.remainingTime -= timeSpent;
            
            // add block to Gantt chart
            // if the last block in the chart is the same process, just merge them 
            let lastBlock = ganttChart[ganttChart.length - 1];
            if (lastBlock && lastBlock.id === currentProcess.id) {
                lastBlock.end = currentTime;
            } else {
                ganttChart.push({ id: currentProcess.id, start: startTime, end: currentTime });
            }
            
            // check if any NEW processes arrived while this process was running
            // they must be added to the queue BEFORE the current process is put back
            while (processIndex < n && processes[processIndex].arrivalTime <= currentTime) {
                readyQueue.push(processes[processIndex]);
                processIndex++;
            }
            
            // if the current process still needs time, put it at the BACK of the queue
            if (currentProcess.remainingTime > 0) {
                readyQueue.push(currentProcess);
            } else {
                // process is totally finished
                currentProcess.completionTime = currentTime;
                currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
                currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                currentProcess.isCompleted = true;
                completedCount++;
            }
        } else {
            // queue is empty but haven't finished all processes, CPU is IDLE
            if (processIndex < n) {
                let nextArrivalTime = processes[processIndex].arrivalTime;
                ganttChart.push({ id: "Idle", start: currentTime, end: nextArrivalTime });
                currentTime = nextArrivalTime;
                while (processIndex < n && processes[processIndex].arrivalTime <= currentTime) {
                    readyQueue.push(processes[processIndex]);
                    processIndex++;
                }
            }
        }
    }
    
    // calculate average waiting time
    let totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
    let avgWaitingTime = totalWaitingTime / processes.length;

    return { 
        processes: processes, 
        ganttChart: ganttChart, 
        avgWaitingTime: avgWaitingTime 
    };
}

function runPreemptiveSJF(processes) {
    // reset properties
    processes.forEach(p => {
        p.remainingTime = p.burstTime;
        p.isCompleted = false;
    });

    let currentTime = 0;
    let completedCount = 0;
    let ganttChart = [];
    const n = processes.length;
    let prevProcessId = null; 

    // simulate cycle-by-cycle (1 millisecond at a time)
    while (completedCount < n) {
        // find all available processes that haven't finished
        let availableProcesses = processes.filter(p => p.arrivalTime <= currentTime && !p.isCompleted);

        if (availableProcesses.length > 0) {
            // sort primarily by remainingTime. If tied, sort by arrivalTime
            availableProcesses.sort((a, b) => {
                if (a.remainingTime === b.remainingTime) {
                    return a.arrivalTime - b.arrivalTime;
                }
                return a.remainingTime - b.remainingTime;
            });

            let selectedProcess = availableProcesses[0];

            // add or extend the block in the Gantt Chart
            if (prevProcessId !== selectedProcess.id) {
                // new process took over the CPU
                ganttChart.push({ id: selectedProcess.id, start: currentTime, end: currentTime + 1 });
            } else {
                // same process is still running, just extend its block
                ganttChart[ganttChart.length - 1].end = currentTime + 1;
            }

            prevProcessId = selectedProcess.id;
            
            // run it for 1 ms
            selectedProcess.remainingTime--;
            currentTime++;

            // check if it finished
            if (selectedProcess.remainingTime === 0) {
                selectedProcess.isCompleted = true;
                selectedProcess.completionTime = currentTime;
                selectedProcess.turnaroundTime = selectedProcess.completionTime - selectedProcess.arrivalTime;
                selectedProcess.waitingTime = selectedProcess.turnaroundTime - selectedProcess.burstTime;
                completedCount++;
            }

        } else {
            // no processes available, CPU is IDLE
            if (prevProcessId !== "Idle") {
                ganttChart.push({ id: "Idle", start: currentTime, end: currentTime + 1 });
            } else {
                ganttChart[ganttChart.length - 1].end = currentTime + 1;
            }
            prevProcessId = "Idle";
            currentTime++;
        }
    }

    // calculate average waiting time
    let totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
    let avgWaitingTime = totalWaitingTime / processes.length;

    return { 
        processes: processes, 
        ganttChart: ganttChart, 
        avgWaitingTime: avgWaitingTime 
    };
}

// --- UI VISUALIZATION FUNCTION ---
function drawGanttChart(results) {
    const chartContainer = document.getElementById('gantt-chart-container');
    const statsContainer = document.getElementById('stats-container');
    
    // clear any existing charts 
    chartContainer.innerHTML = '';
    statsContainer.innerHTML = '';

    // find the total time of the simulation to calculate percentage widths
    const totalTime = results.ganttChart[results.ganttChart.length - 1].end;

    // loop through the chart array and create a visual block for each
    results.ganttChart.forEach(block => {
        const blockDiv = document.createElement('div');
        
        blockDiv.className = block.id === "Idle" ? 'gantt-block idle-block' : 'gantt-block';
        
        // calculate how wide block should be
        const widthPct = ((block.end - block.start) / totalTime) * 100;
        blockDiv.style.width = widthPct + '%';
        
        // put Process ID and times inside block
        blockDiv.innerHTML = `<strong>${block.id}</strong><br><small>${block.start} - ${block.end}</small>`;
        
        // add block to webpage
        chartContainer.appendChild(blockDiv);
    });

    // display average waiting time text
    statsContainer.innerHTML = `<h3>Average Waiting Time: ${results.avgWaitingTime.toFixed(2)} ms</h3>`;
}

// ==========================================
// UI AND HTML CONNECTION CODE
// ==========================================

// 1. function to generate the table rows based on user input
function generateTable() {
    const numProcesses = document.getElementById('num-processes').value;
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = ''; 

    // ensure input is between 3 and 10 as per guidelines
    if (numProcesses < 3 || numProcesses > 10) {
        alert("Please enter a number between 3 and 10.");
        return;
    }

    for (let i = 1; i <= numProcesses; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>P${i}</strong></td>
            <td><input type="number" class="arr-time" min="0" value="0"></td>
            <td><input type="number" class="burst-time" min="1" value="5"></td>
            <td><input type="number" class="priority" min="1" value="1"></td>
        `;
        tbody.appendChild(row);
    }
}

// 2. function that runs when "Simulate" is clicked
function runSimulation() {
    const tbody = document.getElementById('table-body');
    const rows = tbody.getElementsByTagName('tr');
    let processList = [];

    // read data from HTML table
    for (let i = 0; i < rows.length; i++) {
        let id = `P${i + 1}`;
        let arrTime = parseInt(rows[i].querySelector('.arr-time').value);
        let burstTime = parseInt(rows[i].querySelector('.burst-time').value);
        let priority = parseInt(rows[i].querySelector('.priority').value);
        
        processList.push(new Process(id, arrTime, burstTime, priority));
    }

    const algo = document.getElementById('algo-select').value;
    let results;

    // run chosen algorithm
    if (algo === "FCFS") {
        results = runFCFS(processList);
    } else if (algo === "SJF") {
        results = runPreemptiveSJF(processList);
    } else if (algo === "Priority") {
        results = runNonPreemptivePriority(processList);
    } else if (algo === "RR") {
        let quantum = parseInt(document.getElementById('time-quantum').value);
        results = runRoundRobin(processList, quantum);
    }

    // draw visual chart
    drawGanttChart(results);
}

// show/hide time quantum field based on selected algorithm
function toggleQuantumField() {
    const algo = document.getElementById('algo-select').value;
    const quantumLabel = document.getElementById('quantum-label');
    if (algo === 'RR') {
        quantumLabel.style.display = 'inline';
    } else {
        quantumLabel.style.display = 'none';
    }
}

// generate default table of 5 processes when the page first loads & also call toggleQuantumField
window.onload = function() {
    generateTable();
    toggleQuantumField();
};

