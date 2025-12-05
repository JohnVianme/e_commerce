function logout(username) {
  fetch(`logout/${localStorage.getItem("username")}`)
    .then((res) => res.json())
    .then((res) => {
      if (!res.ok) {
        return res.message;
      } else {
        // clear local storate
        localStorage.clear();
        return res.message;
      }
    })
    .catch((err) => {
      console.log("Error: Could not logout()");
      console.log(err);
    });
}
