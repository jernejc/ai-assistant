require("dotenv").config()

const OpenAI = require("openai");
const client = new OpenAI({
  apiKey: process.OPENAI_API_KEY,
});

const assistant_id = "asst_TXgDmV8KQnQ6Xzxtbzl7p9ii";
const user_prompt = "Who will the Board president call";

(async () => {

  console.log("create thread");

  const thread = await client.beta.threads.create();
  const thread_id = thread.id;

  await client.beta.threads.messages.create(
    thread_id,
    {
      role: "user",
      content: user_prompt,
    }
  );

  const run = await client.beta.threads.runs.create(
    thread_id, 
    {
      assistant_id: assistant_id
    }
  );

  const retrieve_run = async () => {
    let run_retrieve;

    console.log("retrieve run");

    while (run.status !== "completed") {
      await sleep(500);
      
      run_retrieve = await client.beta.threads.runs.retrieve(
        thread_id, // Use the stored thread ID for this user
        run.id
      );

      console.log(`run status ${run_retrieve.status}`);

      if (run_retrieve.status === "completed") {
        console.log("\n");
        break;
      } else if (run_retrieve.status === "failed") {
        console.log(`run failed ${run_retrieve}`);
        break;
      }
    }
  };

  const get_response = async () => {
    await retrieve_run();

    const messages = await client.beta.threads.messages.list(
      thread_id 
    );

    const response = messages.data[0].content[0].text.value;
    console.log(response)
  };

  get_response();

})();

// need to sleep (python has this build in)
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}