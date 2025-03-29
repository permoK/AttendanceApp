import { Request, Response, NextFunction } from "express";

// This middleware checks if the client is connected to the school network
// In a production environment, this could be implemented with IP range checks,
// VPN checks, or other network identification mechanisms
export function schoolNetworkOnly(req: Request, res: Response, next: NextFunction) {
  // For development/demo purposes, we're allowing all connections
  // In a real environment, implement actual network verification logic here
  
  // Example implementation (commented out):
  // const clientIP = req.ip;
  // const schoolIPRange = ["192.168.0.0", "192.168.255.255"]; // Example IP range
  // 
  // // Check if the client IP is within the school's IP range
  // const isSchoolNetwork = isIPInRange(clientIP, schoolIPRange);
  // 
  // if (!isSchoolNetwork) {
  //   return res.status(403).json({ 
  //     message: "Access denied. You must be connected to the school network."
  //   });
  // }

  // For now, just log the access and continue
  console.log(`Network access from IP: ${req.ip}`);
  next();
}

// Helper function for IP range check (not used in demo but would be in production)
function isIPInRange(ip: string, range: [string, string]): boolean {
  const ipNum = ipToNum(ip);
  const startNum = ipToNum(range[0]);
  const endNum = ipToNum(range[1]);
  
  return ipNum >= startNum && ipNum <= endNum;
}

function ipToNum(ip: string): number {
  return ip.split('.')
    .map((octet, index) => parseInt(octet) * Math.pow(256, 3 - index))
    .reduce((prev, curr) => prev + curr);
}
