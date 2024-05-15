async function getAllMaps() {
  const res = await fetch('/api/maps')
  return await res.json()
}

export {
  getAllMaps
}