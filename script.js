class Process {
    constructor(id, arrivalTime, burstTime, priority) {
        this.id = id;                     
        this.arrivalTime = arrivalTime;   
        this.burstTime = burstTime;       
        this.priority = priority;         

        this.remainingTime = burstTime;   
        this.completionTime = 0;          
        this.turnaroundTime = 0;          
        this.waitingTime = 0;           
    }
}

function runFCFS(processes) {
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    let currentTime = 0;
    let ganttChart = []; 

    processes.forEach(p => {
        if (currentTime < p.arrivalTime) {
            ganttChart.push({ id: "Idle", start: currentTime, end: p.arrivalTime });
            currentTime = p.arrivalTime;
        }

        let startTime = currentTime;
        currentTime += p.burstTime; 
        p.completionTime = currentTime;
        
        // turnaround and waiting time
        p.turnaroundTime = p.completionTime - p.arrivalTime;
        p.waitingTime = p.turnaroundTime - p.burstTime;

        ganttChart.push({ id: p.id, start: startTime, end: p.completionTime });
    });

    // average waiting time
    let totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
    let avgWaitingTime = totalWaitingTime / processes.length;

    return { 
        processes: processes, 
        ganttChart: ganttChart, 
        avgWaitingTime: avgWaitingTime 
    };
}

function runNonPreemptivePriority(processes) {
    processes.forEach(p => p.isCompleted = false);
    
    let currentTime = 0;
    let completedCount = 0;
    let ganttChart = [];
    const n = processes.length;

    while (completedCount < n) {
        let availableProcesses = processes.filter(p => p.arrivalTime <= currentTime && !p.isCompleted);

        if (availableProcesses.length > 0) {
            availableProcesses.sort((a, b) => {
                if (a.priority === b.priority) {
                    return a.arrivalTime - b.arrivalTime; 
                }
                return a.priority - b.priority;
            });

            let selectedProcess = availableProcesses[0];
            let startTime = currentTime;
            
            currentTime += selectedProcess.burstTime;
            
            selectedProcess.completionTime = currentTime;
            selectedProcess.turnaroundTime = selectedProcess.completionTime - selectedProcess.arrivalTime;
            selectedProcess.waitingTime = selectedProcess.turnaroundTime - selectedProcess.burstTime;
            selectedProcess.isCompleted = true;

            ganttChart.push({ id: selectedProcess.id, start: startTime, end: currentTime });
            
            completedCount++;
        } else {
    
            let futureProcesses = processes.filter(p => !p.isCompleted).sort((a, b) => a.arrivalTime - b.arrivalTime);
            let nextArrivalTime = futureProcesses[0].arrivalTime;
            
            ganttChart.push({ id: "Idle", start: currentTime, end: nextArrivalTime });
            currentTime = nextArrivalTime;
        }
    }

    let totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
    let avgWaitingTime = totalWaitingTime / processes.length;

    return { 
        processes: processes, 
        ganttChart: ganttChart, 
        avgWaitingTime: avgWaitingTime 
    };
}

function runRoundRobin(processes, quantum) {
    processes.forEach(p => {
        p.remainingTime = p.burstTime; 
        p.isCompleted = false;
    });
    
    let currentTime = 0;
    let completedCount = 0;
    let ganttChart = [];
    let readyQueue = [];
    const n = processes.length;
    
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    let processIndex = 0; 
    
    while (processIndex < n && processes[processIndex].arrivalTime <= currentTime) {
        readyQueue.push(processes[processIndex]);
        processIndex++;
    }
    
    if (readyQueue.length === 0 && processIndex < n) {
        currentTime = processes[processIndex].arrivalTime;
        ganttChart.push({ id: "Idle", start: 0, end: currentTime });
        while (processIndex < n && processes[processIndex].arrivalTime <= currentTime) {
            readyQueue.push(processes[processIndex]);
            processIndex++;
        }
    }

    while (completedCount < n) {
        if (readyQueue.length > 0) {
            let currentProcess = readyQueue.shift(); 
            
            let timeSpent = Math.min(currentProcess.remainingTime, quantum);
            let startTime = currentTime;
            currentTime += timeSpent;
            currentProcess.remainingTime -= timeSpent;
            
            let lastBlock = ganttChart[ganttChart.length - 1];
            if (lastBlock && lastBlock.id === currentProcess.id) {
                lastBlock.end = currentTime;
            } else {
                ganttChart.push({ id: currentProcess.id, start: startTime, end: currentTime });
            }
            
            while (processIndex < n && processes[processIndex].arrivalTime <= currentTime) {
                readyQueue.push(processes[processIndex]);
                processIndex++;
            }
            
            if (currentProcess.remainingTime > 0) {
                readyQueue.push(currentProcess);
            } else {
                currentProcess.completionTime = currentTime;
                currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
                currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                currentProcess.isCompleted = true;
                completedCount++;
            }
        } else {
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
    
    // average waiting time
    let totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
    let avgWaitingTime = totalWaitingTime / processes.length;

    return { 
        processes: processes, 
        ganttChart: ganttChart, 
        avgWaitingTime: avgWaitingTime 
    };
}

function runPreemptiveSJF(processes) {
    processes.forEach(p => {
        p.remainingTime = p.burstTime;
        p.isCompleted = false;
    });

    let currentTime = 0;
    let completedCount = 0;
    let ganttChart = [];
    const n = processes.length;
    let prevProcessId = null; 

    while (completedCount < n) {
        let availableProcesses = processes.filter(p => p.arrivalTime <= currentTime && !p.isCompleted);

        if (availableProcesses.length > 0) {
            availableProcesses.sort((a, b) => {
                if (a.remainingTime === b.remainingTime) {
                    return a.arrivalTime - b.arrivalTime;
                }
                return a.remainingTime - b.remainingTime;
            });

            let selectedProcess = availableProcesses[0];

            if (prevProcessId !== selectedProcess.id) {
                ganttChart.push({ id: selectedProcess.id, start: currentTime, end: currentTime + 1 });
            } else {
                ganttChart[ganttChart.length - 1].end = currentTime + 1;
            }

            prevProcessId = selectedProcess.id;
            
            selectedProcess.remainingTime--;
            currentTime++;

            if (selectedProcess.remainingTime === 0) {
                selectedProcess.isCompleted = true;
                selectedProcess.completionTime = currentTime;
                selectedProcess.turnaroundTime = selectedProcess.completionTime - selectedProcess.arrivalTime;
                selectedProcess.waitingTime = selectedProcess.turnaroundTime - selectedProcess.burstTime;
                completedCount++;
            }

        } else {
            if (prevProcessId !== "Idle") {
                ganttChart.push({ id: "Idle", start: currentTime, end: currentTime + 1 });
            } else {
                ganttChart[ganttChart.length - 1].end = currentTime + 1;
            }
            prevProcessId = "Idle";
            currentTime++;
        }
    }

    // average waiting time
    let totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
    let avgWaitingTime = totalWaitingTime / processes.length;

    return { 
        processes: processes, 
        ganttChart: ganttChart, 
        avgWaitingTime: avgWaitingTime 
    };
}

// --- UI FUNCTION ---
function drawGanttChart(results) {
    const chartContainer = document.getElementById('gantt-chart-container');
    const statsContainer = document.getElementById('stats-container');
    
    chartContainer.innerHTML = '';
    statsContainer.innerHTML = '';

    const totalTime = results.ganttChart[results.ganttChart.length - 1].end;

    results.ganttChart.forEach(block => {
        const blockDiv = document.createElement('div');
 
        blockDiv.className = block.id === "Idle" ? 'gantt-block idle-block' : 'gantt-block';

        const widthPct = ((block.end - block.start) / totalTime) * 100;
        blockDiv.style.width = widthPct + '%';
 
        blockDiv.innerHTML = `<strong>${block.id}</strong><br><small>${block.start} - ${block.end}</small>`;
        
        blockDiv.title = `Process: ${block.id} | Start: ${block.start}ms | End: ${block.end}ms`;
        
        chartContainer.appendChild(blockDiv);
    });

    let statsHTML = `<br><h3>Waiting Time for each Process:</h3>`;
    statsHTML += `<div class="wt-container">`; 
  
    let sortedProcesses = [...results.processes].sort((a, b) => {
        return parseInt(a.id.substring(1)) - parseInt(b.id.substring(1));
    });

    sortedProcesses.forEach(p => {
        statsHTML += `<div class="wt-box"><strong>${p.id}</strong> <br> ${p.waitingTime} ms</div>`;
    });
    statsHTML += `</div>`;

    statsHTML += `<h3 class="avg-wt">Average Waiting Time: ${results.avgWaitingTime.toFixed(2)} ms</h3>`;
  
    statsContainer.innerHTML = statsHTML;
}

// ==============
// UI AND HTML
// ==============

function generateTable() {
    const numProcesses = document.getElementById('num-processes').value;
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = ''; 

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

function runSimulation() {
    const tbody = document.getElementById('table-body');
    const rows = tbody.getElementsByTagName('tr');
    let processList = [];

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

    drawGanttChart(results);
}

function toggleQuantumField() {
    const algo = document.getElementById('algo-select').value;
    const quantumLabel = document.getElementById('quantum-label');
    if (algo === 'RR') {
        quantumLabel.style.display = 'inline';
    } else {
        quantumLabel.style.display = 'none';
    }
}

window.onload = function() {
    generateTable();
    toggleQuantumField();
};
