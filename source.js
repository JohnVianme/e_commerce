function logout(username) {
  fetch(`logout/${username}`)
    .then((res) => res.json())
    .then((res) => {
      if (!res.ok) {
        return res.message;
      } else {
        return res.message;
      }
    });
}
