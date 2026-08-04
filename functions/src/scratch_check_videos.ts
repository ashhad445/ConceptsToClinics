import * as admin from "firebase-admin";

admin.initializeApp({
  projectId: "concepts-to-clinics-dev",
});

async function check() {
  console.log("=== CHECKING FIRESTORE COURSES & VIDEOS ===");
  const coursesSnap = await admin.firestore().collection("courses").get();
  
  for (const courseDoc of coursesSnap.docs) {
    console.log(`\nCourse: ${courseDoc.id} | ${courseDoc.data().title}`);
    const playlistsSnap = await courseDoc.ref.collection("playlists").get();
    for (const playlistDoc of playlistsSnap.docs) {
      console.log(`  Playlist: ${playlistDoc.id} | ${playlistDoc.data().title}`);
      const videosSnap = await playlistDoc.ref.collection("videos").get();
      for (const videoDoc of videosSnap.docs) {
        console.log(`    Video: ${videoDoc.id} | title: "${videoDoc.data().title}" | vimeoId: "${videoDoc.data().vimeoId}"`);
      }
    }
  }
}

check().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
