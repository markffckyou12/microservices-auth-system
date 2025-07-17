import React, { useState, useEffect } from 'react';

interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  category: string;
  cve?: string;
  status: 'open' | 'fixed' | 'ignored';
  discoveredAt: string;
  fixedAt?: string;
}

interface SecurityMetrics {
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  fixedVulnerabilities: number;
  securityScore: number;
}

interface SecurityAuditProps {
  onAuditComplete?: (metrics: SecurityMetrics) => void;
}

const SecurityAudit: React.FC<SecurityAuditProps> = ({ onAuditComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [vulnerabilities, setVulnerabilities] = useState<SecurityVulnerability[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalVulnerabilities: 0,
    criticalVulnerabilities: 0,
    highVulnerabilities: 0,
    mediumVulnerabilities: 0,
    lowVulnerabilities: 0,
    fixedVulnerabilities: 0,
    securityScore: 100
  });

  const securityCategories = [
    'Authentication',
    'Authorization',
    'Input Validation',
    'Data Protection',
    'Session Management',
    'API Security',
    'Dependencies',
    'Configuration'
  ];

  const mockVulnerabilities: SecurityVulnerability[] = [
    {
      id: '1',
      severity: 'low',
      title: 'Missing HTTPS Redirect',
      description: 'Application does not enforce HTTPS redirects on all pages',
      category: 'Configuration',
      status: 'open',
      discoveredAt: new Date().toISOString()
    },
    {
      id: '2',
      severity: 'medium',
      title: 'Weak Password Policy',
      description: 'Password requirements do not meet minimum security standards',
      category: 'Authentication',
      status: 'open',
      discoveredAt: new Date().toISOString()
    },
    {
      id: '3',
      severity: 'high',
      title: 'SQL Injection Vulnerability',
      description: 'User input not properly sanitized in database queries',
      category: 'Input Validation',
      cve: 'CVE-2024-1234',
      status: 'fixed',
      discoveredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      fixedAt: new Date().toISOString()
    },
    {
      id: '4',
      severity: 'critical',
      title: 'Exposed API Keys',
      description: 'API keys are exposed in client-side code',
      category: 'Data Protection',
      status: 'open',
      discoveredAt: new Date().toISOString()
    }
  ];

  const calculateSecurityScore = (vulns: SecurityVulnerability[]): number => {
    let score = 100;
    
    vulns.forEach(vuln => {
      if (vuln.status === 'open') {
        switch (vuln.severity) {
          case 'critical':
            score -= 25;
            break;
          case 'high':
            score -= 15;
            break;
          case 'medium':
            score -= 10;
            break;
          case 'low':
            score -= 5;
            break;
        }
      }
    });

    return Math.max(0, score);
  };

  const calculateMetrics = (vulns: SecurityVulnerability[]): SecurityMetrics => {
    const total = vulns.length;
    const critical = vulns.filter(v => v.severity === 'critical' && v.status === 'open').length;
    const high = vulns.filter(v => v.severity === 'high' && v.status === 'open').length;
    const medium = vulns.filter(v => v.severity === 'medium' && v.status === 'open').length;
    const low = vulns.filter(v => v.severity === 'low' && v.status === 'open').length;
    const fixed = vulns.filter(v => v.status === 'fixed').length;
    const securityScore = calculateSecurityScore(vulns);

    return {
      totalVulnerabilities: total,
      criticalVulnerabilities: critical,
      highVulnerabilities: high,
      mediumVulnerabilities: medium,
      lowVulnerabilities: low,
      fixedVulnerabilities: fixed,
      securityScore
    };
  };

  const runSecurityScan = async () => {
    setIsScanning(true);
    setProgress(0);

    try {
      // Simulate security scanning process
      const scanSteps = [
        { name: 'Authentication Check', duration: 1000 },
        { name: 'Authorization Audit', duration: 1500 },
        { name: 'Input Validation Test', duration: 2000 },
        { name: 'Data Protection Review', duration: 1200 },
        { name: 'Session Management Check', duration: 800 },
        { name: 'API Security Scan', duration: 1800 },
        { name: 'Dependency Analysis', duration: 2200 },
        { name: 'Configuration Review', duration: 1000 }
      ];

      for (let i = 0; i < scanSteps.length; i++) {
        const step = scanSteps[i];
        setProgress(((i + 1) / scanSteps.length) * 100);
        
        // Simulate finding vulnerabilities
        if (Math.random() < 0.3) { // 30% chance of finding a vulnerability
          const newVuln: SecurityVulnerability = {
            id: Date.now().toString(),
            severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
            title: `Security Issue in ${step.name}`,
            description: `Potential security vulnerability detected during ${step.name.toLowerCase()}`,
            category: securityCategories[Math.floor(Math.random() * securityCategories.length)],
            status: 'open',
            discoveredAt: new Date().toISOString()
          };
          
          setVulnerabilities(prev => [...prev, newVuln]);
        }
        
        await new Promise(resolve => setTimeout(resolve, step.duration));
      }

      // Add some mock vulnerabilities
      setVulnerabilities(prev => [...prev, ...mockVulnerabilities]);
      
      // Calculate final metrics
      const finalVulns = [...vulnerabilities, ...mockVulnerabilities];
      const finalMetrics = calculateMetrics(finalVulns);
      setMetrics(finalMetrics);
      
      onAuditComplete?.(finalMetrics);
      
      alert(`Security scan completed! Found ${finalMetrics.totalVulnerabilities} vulnerabilities.`);
    } catch (error) {
      console.error('Security scan failed:', error);
      alert('Security scan failed. Please try again.');
    } finally {
      setIsScanning(false);
      setProgress(0);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <>
      {/* Security Audit Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Security Audit
      </button>

      {/* Security Audit Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Security Audit
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Security Score */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Security Score</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Overall security assessment
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getSecurityScoreColor(metrics.securityScore)}`}>
                      {metrics.securityScore}/100
                    </div>
                    <div className="text-xs text-gray-500">
                      {metrics.securityScore >= 90 ? 'Excellent' :
                       metrics.securityScore >= 70 ? 'Good' :
                       metrics.securityScore >= 50 ? 'Fair' : 'Poor'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vulnerability Summary */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Vulnerability Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{metrics.criticalVulnerabilities}</div>
                    <div className="text-xs text-red-600">Critical</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{metrics.highVulnerabilities}</div>
                    <div className="text-xs text-orange-600">High</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{metrics.mediumVulnerabilities}</div>
                    <div className="text-xs text-yellow-600">Medium</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{metrics.lowVulnerabilities}</div>
                    <div className="text-xs text-blue-600">Low</div>
                  </div>
                </div>
              </div>

              {/* Scan Progress */}
              {isScanning && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Running security scan...</span>
                    <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Vulnerabilities List */}
              {vulnerabilities.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Detected Vulnerabilities</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {vulnerabilities.map((vuln) => (
                      <div key={vuln.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                                {vuln.severity.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">{vuln.category}</span>
                              {vuln.cve && (
                                <span className="text-xs text-gray-500 font-mono">{vuln.cve}</span>
                              )}
                            </div>
                            <h5 className="text-sm font-medium text-gray-900">{vuln.title}</h5>
                            <p className="text-xs text-gray-600 mt-1">{vuln.description}</p>
                            <div className="text-xs text-gray-500 mt-2">
                              Discovered: {new Date(vuln.discoveredAt).toLocaleDateString()}
                              {vuln.fixedAt && (
                                <span className="ml-4">Fixed: {new Date(vuln.fixedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              vuln.status === 'fixed' ? 'text-green-600 bg-green-100' :
                              vuln.status === 'ignored' ? 'text-gray-600 bg-gray-100' :
                              'text-red-600 bg-red-100'
                            }`}>
                              {vuln.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isScanning}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  onClick={runSecurityScan}
                  disabled={isScanning}
                  className="px-4 py-2 bg-purple-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {isScanning ? 'Scanning...' : 'Run Security Scan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SecurityAudit; 