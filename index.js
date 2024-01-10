require('dotenv').config()

const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.OPENAI_KEY, // Replace with your OpenAI API key
});

const threadByUser = {}; // Store thread IDs by user

const assistantIdToUse = "asst_TXgDmV8KQnQ6Xzxtbzl7p9ii"; // Replace with your assistant ID
const userId = "test"; // you could have different threads for different users

// run this mess in async wrapper

(async () => {

// Create a new thread if it's the user's first message
if (!threadByUser[userId]) {
  try {
    const myThread = await openai.beta.threads.create();
    console.log("New thread created with ID: ", myThread.id, "\n");
    threadByUser[userId] = myThread.id; // Store the thread ID for this user
  } catch (error) {
    console.error("Error creating thread:", error);
    return;
  }
}

const userMessage = "What is Cupertino high school address"; // This is the user prompt

// Add a Message to the Thread
try {
  const myThreadMessage = await openai.beta.threads.messages.create(
    threadByUser[userId], // Use the stored thread ID for this user
    {
      role: "user",
      content: userMessage,
    }
  );

  console.log("This is the message object: ", myThreadMessage, "\n");

  const myRun = await openai.beta.threads.runs.create(
    threadByUser[userId], // Use the stored thread ID for this user
    {
      assistant_id: assistantIdToUse,
      instructions: "You are a helpful assistant that leverages retrieved files to answer questions.", // Your instructions here
      tools: [
        { type: "retrieval" }, // Retrieval tool
      ],
    }
  );

  console.log("This is the run object: ", myRun, "\n");

  // Periodically retrieve the Run to check on its status
  const retrieveRun = async () => {
    let keepRetrievingRun;

    while (myRun.status !== "completed") {
      keepRetrievingRun = await openai.beta.threads.runs.retrieve(
        threadByUser[userId], // Use the stored thread ID for this user
        myRun.id
      );

      console.log(`Run status: ${keepRetrievingRun.status}`);

      if (keepRetrievingRun.status === "completed") {
        console.log("\n");
        break;
      } else if (keepRetrievingRun.status === "failed") {
        console.log("Run failed", keepRetrievingRun);
        break;
      }
    }
  };

  // Retrieve the Messages added by the Assistant to the Thread
  const waitForAssistantMessage = async () => {
    await retrieveRun();

    const allMessages = await openai.beta.threads.messages.list(
      threadByUser[userId] // Use the stored thread ID for this user
    );

    const response = allMessages.data[0].content[0].text.value;

    console.log(response)
    console.log(
      "------------------------------------------------------------ \n"
    );

    console.log("User: ", myThreadMessage.content[0].text.value);
    console.log("Assistant: ", allMessages.data[0].content[0].text.value);
  };

  waitForAssistantMessage();
} catch (error) {
  console.error("Error:", error);
}

})();