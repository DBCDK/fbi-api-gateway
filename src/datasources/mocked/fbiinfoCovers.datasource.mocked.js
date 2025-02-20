export async function load(pid) {
  return (
    {
      "870970-basis:26521556": {
        resources: {
          "480px": { url: "link-to-480px", width: 480, height: 800 },
          "960px": { url: "link-to-960px", width: 960, height: 800 },
          "240px": { url: "link-to-240px", width: 240, height: 800 },
          "120px": { url: "link-to-120px", width: 120, height: 800 },
        },
      },
      "870970-basis:29433909": {
        resources: {
          "480px": { url: "link-to-480px", width: 480, height: 800 },
          "960px": { url: "link-to-960px", width: 960, height: 800 },
          "240px": { url: "link-to-240px", width: 240, height: 800 },
          "120px": { url: "link-to-120px", width: 120, height: 800 },
        },
      },
      moreinfo_working_pid: {
        resources: {
          "480px": { url: "link-to-480px", width: 480, height: 800 },
          "960px": { url: "link-to-960px", width: 960, height: 800 },
          "240px": { url: "link-to-240px", width: 240, height: 800 },
          "120px": { url: "link-to-120px", width: 120, height: 800 },
        },
      },
    }[pid] || {}
  );
}
