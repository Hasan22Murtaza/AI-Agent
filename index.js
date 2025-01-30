import OpenAI from "openai";
import readlineSync from "readline-sync";
import 'dotenv/config';

// OpenAI API Key (Make sure to set this securely)
const OPENAI_API_KEY = process.env.OPEN_AI_KEY;

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Function to simulate getting weather data for different cities
function getWeather(city) {
  const cityWeather = {
    islamabad: "18°C",
    karachi: "25°C",
    lahore: "22°C",
    peshawar: "20°C",
    quetta: "15°C",
    multan: "24°C",
    faisalabad: "23°C",
    rawalpindi: "19°C",
    hyderabad: "26°C",
    patiala: "10°C",
  };

  // Convert city name to lowercase for case-insensitive lookup
  const weather = cityWeather[city.toLowerCase()];
  return weather || "Weather data not available for this city.";
}

// Mapping available tools for the AI agent
const tools = {
  getWeather: getWeather,
};

// System prompt defining AI behavior and response format
const SYSTEM_PROMT = `
You are an AI Assistant with START, PLAN, ACTION, Observation, and Output State.
Wait for the user prompt and first PLAN using available tools. 
After Planning, take the action with appropriate tools and wait for Observation on Action. 
Once you get the observations, return the AI response based on the START prompt and observations.

Strictly follow the JSON output format as in examples.

Available Tools:
- function getWeather(city: string): string
getWeather is a function that accepts a city name as a string and returns the weather details.

Example: 
START 
{ "type" : "user", "user": "what is the sum of weather of multan and faisalabad"}
{ "type" : "plan", "plan": "I will call getWeather for multan"}
{ "type" : "action", "function": "getWeather", "input": "multan"}
{ "type" : "observation", "observation": "24°C"}
{ "type" : "plan", "plan": "I will call getWeather for faisalabad"}
{ "type" : "action", "function": "getWeather", "input": "faisalabad"}
{ "type" : "observation", "observation": "23°C"}
{ "type" : "output", "output": "The sum of weather of multan and faisalabad is 47°C"}
`;

// Initialize conversation history with system prompt
const messages = [{ role: "system", content: SYSTEM_PROMT }];

while (true) {
  // Get user input
  const query = readlineSync.question(">> ");
  
  // Format user input into JSON structure
  const q = {
    type: "user",
    user: query,
  };
  messages.push({ role: "user", content: JSON.stringify(q) });

  while (true) {
    // Call OpenAI GPT model to process user query
    const chat = await client.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" },
    });

    // Extract AI response
    const result = chat.choices[0].message.content;

    console.log(`\n\n---------------- START AI --------------------`);
    console.log(result);
    console.log(`---------------- END AI --------------------\n\n`);

    // Store AI response in conversation history
    messages.push({ role: "assistant", content: result });

    // Parse AI response to check the next action
    const call = JSON.parse(result);

    // If output is generated, display the result and break the loop
    if (call.type === "output") {
      console.log(`=>: ${call.output}`);
      break;
    } 
    // If an action is required, execute the function and observe the result
    else if (call.type === "action") {
      const fn = tools[call.function]; // Get the function from tools
      const observation = fn(call.input); // Call the function with the provided input

      // Format observation response
      const obs = { type: "observation", observation: observation };

      // Append observation to messages for AI to process
      messages.push({ role: "developer", content: JSON.stringify(obs) });
    }
  }
}

// Below is an alternative implementation of making a single API call
// (Uncomment this section if needed)

// const user = "Hey, What is the weather of faisalabad";

// client.chat.completions
//   .create({
//     model: "gpt-3.5-turbo-0125",
//     messages: [
//       { role: "system", content: SYSTEM_PROMT },
//       { role: "user", content: user },
//     ],
//   })
//   .then((e) => {
//     console.log(e.choices[0].message.content);
//   });
