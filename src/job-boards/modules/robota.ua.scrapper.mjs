import { getRobotaUaTokenToEnv, performLogin } from '../job-board.utils.mjs';
import fs from 'fs'; // Import the file system module
import path from 'path'; // Import the path module

// Define the log file path
const logFilePath = path.join(process.cwd(), 'app.log'); // Log file in the current working directory

// Helper function to write logs
const writeLog = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  try {
    fs.appendFileSync(logFilePath, logMessage); // Append to the log file
  } catch (err) {
    console.error('Failed to write to log file:', err); // Log to console if file logging fails
  }
};

export const robotaUaModule = async () => {
  writeLog('robotaUaModule started.'); // Log the start of the function
  try {
    // const cookieString =
    //   '_ga=GA1.1.1204849188.1748425504; _fbp=fb.1.1748425503795.871518994160306176; _gcl_au=1.1.1271314621.1748425504; rua-usm=date=28.05.2025&ptype=100&ts=1&id=fc1157414d2946fd8785249e4c1c1e58; searchEventAction=no_suggest; ASP.NET_SessionId=xpgzvkcukdkvlbldtw3tz1uy; __cf_bm=nwdg8vFs13jiCM.JjOh46Nq_ZnlL7xtgBnfRxxvNbtQ-1748947476-1.0.1.1-t6UICJpAODklD6L75DN8UC3jqn.I9uPej4z9S_UFgPloFUmZN7vdkKBWxE_fuVMlYDWf9IrwmDi2jhL17kRqGYljXoyoxUeUb.Vgpi9nFRE; uid=16969021; rua-usm2=date=03.06.2025&ptype=100&ts=24; _hjSession_2729827=eyJpZCI6ImI4YTY5OTMyLTU0ZjktNGNlMy1hOGE0LWViNTNmNmI4OTdkNCIsImMiOjE3NDg5NDc3OTM1NzEsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjoxLCJzcCI6MH0=; _hjSessionUser_2729827=eyJpZCI6ImQ1YjFlMTUzLWI4ZTYtNWViYy1hNTAxLWNkMmVkYzBiZDVlZSIsImNyZWF0ZWQiOjE3NDg5NDc3OTM1NzAsImV4aXN0aW5nIjp0cnVlfQ==; _ga_WS6TVT9PSM=GS2.1.s1748946877$o3$g1$t1748947949$j50$l0$h1152344532';

    writeLog(`Attempting login with username: ${process.env.ROBOTA_UA_EMAIL}`);
    await performLogin(
      {
        username: process.env.ROBOTA_UA_EMAIL,
        password: process.env.ROBOTA_UA_PASSWORD,
      }
      //   cookieString
    );
    writeLog('Login successful.'); // Log successful login
  } catch (e) {
    writeLog(`Error in robotaUaModule: ${e.message}`); // Log the error message
    if (e.stack) {
      writeLog(`Stack trace: ${e.stack}`); // Optionally log the stack trace
    }
    // console.error('Error in robotaUaModule:', e); // You can still keep console logging if needed
  }
  // getRobotaUaTokenToEnv(); // This line is commented out in your original code
};

if (process.env.ENV === 'TEST') {
  writeLog('Running in TEST environment.');
  robotaUaModule()
    .then(() => {
      writeLog('robotaUaModule finished execution in TEST environment.');
    })
    .catch((err) => {
      writeLog(`Unhandled error during TEST execution: ${err.message}`);
    });
}
