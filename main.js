const WebSocket = require('ws');
const { promisify } = require('util');
const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const chalk = require('chalk');

// Hiển thị thông tin ứng dụng
console.log(chalk.blue.bold(` █████   █████                                `));
console.log(chalk.blue.bold(`░░███   ░░███                                 `));
console.log(chalk.blue.bold(` ░███    ░███   ██████   ████████    ██████  `));
console.log(chalk.blue.bold(` ░███████████  ░░░░░███ ░░███░░███  ░░░░░███ `));
console.log(chalk.blue.bold(` ░███░░░░░███   ███████  ░███ ░███   ███████ `));
console.log(chalk.blue.bold(` ░███    ░███  ███░░███  ░███ ░███  ███░░███ `));
console.log(chalk.blue.bold(` █████   █████░░████████ ████ █████░░████████`));
console.log(chalk.blue.bold(`░░░░░   ░░░░░  ░░░░░░░░ ░░░░ ░░░░░  ░░░░░░░░ `));

// Hiển thị thông tin người chỉnh sửa
console.log(chalk.magentaBright.bold(`\n====================================`));
console.log(chalk.magentaBright.bold(`\nEdited by Hana`));
console.log(chalk.magentaBright.bold(`https://web.telegram.org/k/#@freetool01`));
console.log(chalk.magentaBright.bold(`Tú Bà Hana iu thưn bạn :*\n`));
console.log(chalk.magentaBright.bold(`====================================\n`));

let sockets = [];  
let pingIntervals = []; 
let countdownIntervals = []; 
let potentialPoints = 0;
let countdown = "Calculating...";

const authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra25uZ3JneHV4Z2pocGxicGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MzgxNTAsImV4cCI6MjA0MTAxNDE1MH0.DRAvf8nH1ojnJBc3rD_Nw6t1AV8X_g6gmY_HByG2Mag";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra25uZ3JneHV4Z2pocGxicGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MzgxNTAsImV4cCI6MjA0MTAxNDE1MH0.DRAvf8nH1ojnJBc3rD_Nw6t1AV8X_g6gmY_HByG2Mag";

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getLocalStorage() {
  try {
    const data = await readFileAsync('localStorage.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {}; 
  }
}

async function setLocalStorage(data) {
  const currentData = await getLocalStorage();
  const newData = { ...currentData, ...data };
  await writeFileAsync('localStorage.json', JSON.stringify(newData));
}

async function connectWebSocket(userId, proxy) {
  const version = "v0.2";
  const url = "wss://secure.ws.teneo.pro";
  const wsUrl = `${url}/websocket?userId=${encodeURIComponent(userId)}&version=${encodeURIComponent(version)}`;

  const options = {};
  if (proxy) {
    options.agent = new HttpsProxyAgent(proxy);
  }

  const connect = () => {
    const socket = new WebSocket(wsUrl, options);
    sockets.push(socket);

    socket.onopen = async () => {
      const connectionTime = new Date().toISOString();
      await setLocalStorage({ lastUpdated: connectionTime });
      console.log("WebSocket connected at", connectionTime);
      startPinging(socket);
      startCountdownAndPoints(socket);
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log("Received message from WebSocket:", data);
      if (data.pointsTotal !== undefined && data.pointsToday !== undefined) {
        const lastUpdated = new Date().toISOString();
        await setLocalStorage({
          lastUpdated: lastUpdated,
          pointsTotal: data.pointsTotal,
          pointsToday: data.pointsToday,
        });
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected. Reconnecting in 5 seconds...");
      stopPinging(socket);
      setTimeout(connect, 5000); 
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

  connect();
}

function disconnectWebSocket(socket) {
  if (socket) {
    socket.close();
    stopPinging(socket);
  }
}

function startPinging(socket) {
  const pingInterval = setInterval(async () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "PING" }));
      await setLocalStorage({ lastPingDate: new Date().toISOString() });
    }
  }, 15000); 
  pingIntervals.push(pingInterval); 
}

function stopPinging(socket) {
  const index = sockets.indexOf(socket);
  if (index > -1) {
    clearInterval(pingIntervals[index]);
    pingIntervals.splice(index, 1); 
    sockets.splice(index, 1); 
  }
}

// Định nghĩa hàm tạm cho startCountdownAndPoints
function startCountdownAndPoints(socket) {
  const countdownInterval = setInterval(() => {
    console.log("Countdown and points logic running...");
  }, 10000);
  countdownIntervals.push(countdownInterval);
}

async function getUserId(email, password, proxy) {
  const loginUrl = "https://ikknngrgxuxgjhplbpey.supabase.co/auth/v1/token?grant_type=password";

  try {
    const response = await axios.post(loginUrl, {
      email: email,
      password: password
    }, {
      headers: {
        'Authorization': authorization,
        'apikey': apikey
      }
    });

    const userId = response.data.user.id;
    console.log('User ID:', userId);

    const profileUrl = `https://ikknngrgxuxgjhplbpey.supabase.co/rest/v1/profiles?select=personal_code&id=eq.${userId}`;
    const profileResponse = await axios.get(profileUrl, {
      headers: {
        'Authorization': authorization,
        'apikey': apikey
      }
    });

    console.log('Profile Data:', profileResponse.data);
    await setLocalStorage({ userId });
    await connectWebSocket(userId, proxy);

    // Tăng thời gian giữa các request
    await new Promise(resolve => setTimeout(resolve, 10000 + Math.random() * 5000));

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

async function loadAccounts() {
  const accountsData = await readFileAsync('accounts.txt', 'utf8');
  const accounts = accountsData.split('\n').map(line => {
    const trimmedLine = line.trim();
    const [email, password] = trimmedLine.split(':');
    return { email, password };
  }).filter(account => account.email && account.password);
  
  if (accounts.length === 0) {
    console.error("No valid accounts found in accounts.txt.");
  }
  
  return accounts;
}

async function loadProxies() {
  const proxiesData = await readFileAsync('proxy.txt', 'utf8');
  const proxies = proxiesData.split('\n').filter(proxy => proxy.trim());
  
  if (proxies.length === 0) {
    console.error("No valid proxies found in proxy.txt.");
  }

  return proxies;
}

async function main() {
  const localStorageData = await getLocalStorage();
  let userId = localStorageData.userId;

  const proxies = await loadProxies();
  if (proxies.length === 0) {
    console.log("No proxies found. Exiting...");
    process.exit(1);
  }

  const accounts = await loadAccounts();
  if (accounts.length === 0) {
    console.log("No accounts found. Exiting...");
    process.exit(1);
  }

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const proxy = proxies[i % proxies.length]; 
    await getUserId(account.email, account.password, proxy);
  }
}

main();
