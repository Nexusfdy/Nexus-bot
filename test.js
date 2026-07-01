import jwt from "jsonwebtoken";

async function run() {
  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET || "default_super_secret_key_nexus_admin_12345");
  console.log("Token generated");

  const newProduct = {
    name: "Test Product",
    price: 1000,
    type: "Digital",
    category: "Test"
  };
  const createRes = await fetch("http://localhost:3000/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify(newProduct)
  });
  console.log("Create status:", createRes.status);
  
  const res = await fetch("http://localhost:3000/api/products", {
    headers: { "Authorization": "Bearer " + token }
  });
  const products = await res.json();
  if (products && products.length > 0) {
    const p = products[products.length - 1]; // get latest
    console.log("Attempting to delete product:", p.id, "Type of id:", typeof p.id);
    const delRes = await fetch("http://localhost:3000/api/products/" + encodeURIComponent(p.id), { 
      method: 'DELETE',
      headers: { "Authorization": "Bearer " + token }
    });
    const result = await delRes.text();
    console.log("Status:", delRes.status);
    console.log("Result:", result);
  } else {
    console.log("No products found.");
  }
}
run().catch(console.error);
