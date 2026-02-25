import axios from "axios";

async function testWakaTime(username: string) {
  try {
    const url = `https://wakatime.com/api/v1/users/${username}/stats?is_including_today=true`;
    console.log(`Calling: ${url}`);
    const response = await axios.get(url);
    console.log("Status:", response.status);
    console.log("Data keys:", Object.keys(response.data));
    if (response.data.data) {
      console.log("Stats found:", response.data.data.human_readable_total);
    } else {
      console.log("No data field in response");
    }
  } catch (err: any) {
    console.error("Error Status:", err.response?.status);
    console.error("Error Data:", JSON.stringify(err.response?.data, null, 2));
    if (err.response?.status === 401) {
      console.log(
        "Suggestion: Make sure your stats are set to 'Public' in WakaTime settings.",
      );
    }
  }
}

testWakaTime("ramonsantos9");
