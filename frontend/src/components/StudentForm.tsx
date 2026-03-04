import { useState } from "react";

export default function StudentForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:4000/api/demo/student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
        }),
      });

      const data = await res.json();
      console.log(data);

      setMessage("✅ Data saved to database!");
      setName("");
      setEmail("");
    } catch (error) {
      console.error(error);
      setMessage("❌ Error saving data");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add Student</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <br /><br />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br /><br />

        <button type="submit">Save</button>
      </form>

      <p>{message}</p>
    </div>
  );
}
