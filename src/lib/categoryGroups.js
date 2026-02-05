// src/lib/categoryGroups.js
export function groupFromCategory(cat = "") {
    const c = (cat || "").toLowerCase();
  
    if (c.includes("museum") || c.includes("planetarium") || c.includes("bildung") || c.includes("kultur"))
      return "Kultur";
  
    if (c.includes("wellness") || c.includes("therme"))
      return "Wellness";
  
    if (c.includes("freizeitpark") || c.includes("indoor") || c.includes("park"))
      return "Freizeit";
  
    if (c.includes("tier") || c.includes("zoo") || c.includes("wildpark"))
      return "Tiere";
  
    if (c.includes("reiten") || c.includes("sport"))
      return "Sport";
  
    if (c.includes("manufaktur") || c.includes("kulinarik") || c.includes("brauerei") || c.includes("genuss"))
      return "Genuss";
  
    if (c.includes("stadt") || c.includes("tour"))
      return "Stadt";
  
    // default
    return "Natur";
  }
  