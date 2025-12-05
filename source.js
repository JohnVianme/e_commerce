function logout() {
  const username = localStorage.getItem("username");
  if (!username) {
    alert("You need to login!");
    window.location.href = "/";
    return;
  }
  fetch(`logout/${username}`)
    .then((res) => {
      console.log(res);
      return res.json();
    })
    .then((data) => {
      if (!data.ok) {
        // clear local storate
        localStorage.clear();
        alert(data.message);
        window.location.href = "/";
        return;
      } else {
        // clear local storate
        localStorage.clear();
        return data.message;
      }
    })
    .catch((err) => {
      console.log("Error: Could not logout()");
      console.log(err);
    });
}
