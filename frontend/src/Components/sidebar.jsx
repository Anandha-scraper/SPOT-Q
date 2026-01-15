import React, { useState, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Anvil, Weight, FlaskConical, UserCog, LogOut, Microscope, Hammer, Briefcase, Server, ShieldCheck } from 'lucide-react';
import { RiExpandRightFill } from 'react-icons/ri';
import { GiRingMould, GiMeltingMetal } from 'react-icons/gi';
import { AuthContext } from '../context/AuthContext';
import '../styles/ComponentStyles/sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useContext(AuthContext);
  // Start collapsed - expand on hover or when pinned
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false); // Start unpinned
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedSubmenuItem, setExpandedSubmenuItem] = useState(null); // Track expanded nested submenu items
  const collapseTimeoutRef = useRef(null); // Track collapse timeout
  const manuallyCollapsedRef = useRef(new Set()); // Track manually collapsed sections
  const manuallyCollapsedSubmenuRef = useRef(new Set()); // Track manually collapsed nested submenu items

  const toggleSection = (section, e) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Mark that this is a manual toggle
    isManualToggleRef.current = true;
    
    // Clear any pending collapse timeout
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    
    // If sidebar is collapsed, expand it first
    if (!isExpanded) {
      setIsExpanded(true);
      setExpandedSection(section);
      // Remove from manually collapsed when expanding
      manuallyCollapsedRef.current.delete(section);
    } else {
      // Toggle the section - if it's already expanded, collapse it; otherwise expand it
      if (expandedSection === section) {
        // User is manually collapsing this section
        setExpandedSection(null);
        manuallyCollapsedRef.current.add(section);
      } else {
        // User is expanding this section
        setExpandedSection(section);
        manuallyCollapsedRef.current.delete(section);
      }
    }
  };

  // Map department names to routes
  const getRouteForDepartment = (deptName, submenuItem = null, mode = 'entry') => {
    const routeMap = {
      'Process': {
        'Entry': '/process',
        'Report': '/process/report'
      },
      'Micro Tensile': {
        'Entry': '/micro-tensile',
        'Report': '/micro-tensile/report'
      },
      'Tensile': {
        'Entry': '/tensile',
        'Report': '/tensile/report'
      },
      'QC Production': {
        'Entry': '/qc-production-details',
        'Report': '/qc-production-details/report'
      },
      'Micro Structure': {
        'Entry': '/micro-structure',
        'Report': '/micro-structure/report'
      },
      'Impact': {
        'Entry': '/impact',
        'Report': '/impact/report'
      },
      'Moulding': {
        'Disamatic Product': {
          'Entry': '/moulding/disamatic-product',
          'Report': '/moulding/disamatic-product/report'
        },
        'Dmm Settings Parameter': {
          'Entry': '/moulding/dmm-setting-parameters',
          'Report': '/moulding/dmm-setting-parameters/report'
        }
      },
      'Sand Lab': {
        'Sand Testing Record': {
          'Entry': '/sand-lab/sand-testing-record',
          'Report': '/sand-lab/sand-testing-record/report'
        },
        'Foundry Sand Testing Note': {
          'Entry': '/sand-lab/foundry-sand-testing-note',
          'Report': '/sand-lab/foundry-sand-testing-note/report'
        }
      },
      'Melting': {
        'Melting Log Sheet': {
          'Entry': '/melting/melting-log-sheet',
          'Report': '/melting/melting-log-sheet/report'
        },
        'Cupola Holder Log Sheet': {
          'Entry': '/melting/cupola-holder-log-sheet',
          'Report': '/melting/cupola-holder-log-sheet/report'
        }
      }
    };

    if (submenuItem && routeMap[deptName] && typeof routeMap[deptName] === 'object') {
      const deptRoutes = routeMap[deptName];
      // Check if the submenuItem has nested routes (like Moulding -> Disamatic Product -> Entry/Report)
      if (deptRoutes[submenuItem] && typeof deptRoutes[submenuItem] === 'object') {
        // This is a nested submenu structure - for route checking, return Entry route
        // The actual navigation will use getRouteForNestedSubmenu
        const nestedRoutes = deptRoutes[submenuItem];
        if (nestedRoutes['Entry']) {
          return nestedRoutes['Entry'];
        }
        return '#';
      }
      // Direct route (e.g., Process -> Entry)
      return deptRoutes[submenuItem] || '#';
    }
    return routeMap[deptName] || '#';
  };

  // Get route for nested submenu items (e.g., Moulding -> Disamatic Product -> Entry/Report)
  const getRouteForNestedSubmenu = (deptName, submenuItemKey, nestedItemKey) => {
    const routeMap = {
      'Moulding': {
        'Disamatic Product': {
          'Entry': '/moulding/disamatic-product',
          'Report': '/moulding/disamatic-product/report'
        },
        'Dmm Settings Parameter': {
          'Entry': '/moulding/dmm-setting-parameters',
          'Report': '/moulding/dmm-setting-parameters/report'
        }
      },
      'Sand Lab': {
        'Sand Testing Record': {
          'Entry': '/sand-lab/sand-testing-record',
          'Report': '/sand-lab/sand-testing-record/report'
        },
        'Foundry Sand Testing Note': {
          'Entry': '/sand-lab/foundry-sand-testing-note',
          'Report': '/sand-lab/foundry-sand-testing-note/report'
        }
      },
      'Melting': {
        'Melting Log Sheet': {
          'Entry': '/melting/melting-log-sheet',
          'Report': '/melting/melting-log-sheet/report'
        },
        'Cupola Holder Log Sheet': {
          'Entry': '/melting/cupola-holder-log-sheet',
          'Report': '/melting/cupola-holder-log-sheet/report'
        }
      }
    };
    
    if (routeMap[deptName] && routeMap[deptName][submenuItemKey] && routeMap[deptName][submenuItemKey][nestedItemKey]) {
      return routeMap[deptName][submenuItemKey][nestedItemKey];
    }
    return '#';
  };

  // Check if route is active - exact match first, then check for nested routes
  const isActiveRoute = (route) => {
    if (!route || route === '#') return false;
    const pathname = location.pathname;
    
    // Exact match
    if (pathname === route) return true;
    
    // Check if pathname starts with route + '/' for nested routes
    // But exclude cases where route is a substring (e.g., /process shouldn't match /process/report exactly)
    if (pathname.startsWith(route + '/')) {
      // Make sure we're not matching a parent route when we want a child route
      // For example, /process should not match /process/report
      // Only match if the route is actually a prefix and there's more path after it
      return true;
    }
    
    return false;
  };



  // Department mapping
  const departmentMap = {
    'Process': 'Process',
    'Micro Tensile': 'Micro Tensile',
    'Tensile': 'Tensile',
    'Moulding': 'Moulding',
    'QC Production': 'QC - production',
    'Micro Structure': 'Micro Structure',
    'Impact': 'Impact',
    'Sand Lab': 'Sand Lab',
    'Melting': 'Melting'
  };

  // Filter departments based on user's department
  const filterDepartments = (departments) => {
    if (isAdmin || user?.department === 'Admin') {
      return departments;
    }
    return departments.filter(dept => departmentMap[dept.name] === user?.department);
  };

  const departments = [
    { 
      id: 1, 
      name: 'Process', 
      icon: <Server />, 
      hasSubmenu: true, 
      department: 'Process',
      submenuItems: [
        { name: 'Entry', key: 'Entry' },
        { name: 'Report', key: 'Report' }
      ]
    },
    { 
      id: 2, 
      name: 'Micro Tensile', 
      icon: <Anvil />, 
      hasSubmenu: true, 
      department: 'Micro Tensile',
      submenuItems: [
        { name: 'Entry', key: 'Entry' },
        { name: 'Report', key: 'Report' }
      ]
    },
    { 
      id: 3, 
      name: 'Tensile', 
      icon: <Weight />, 
      hasSubmenu: true, 
      department: 'Tensile',
      submenuItems: [
        { name: 'Entry', key: 'Entry' },
        { name: 'Report', key: 'Report' }
      ]
    },
    { 
      id: 4, 
      name: 'Moulding', 
      icon: <GiRingMould />, 
      hasSubmenu: true, 
      department: 'Moulding',
      submenuItems: [
        { 
          name: 'Disamatic Product', 
          key: 'Disamatic Product',
          hasSubmenu: true,
          submenuItems: [
            { name: 'Entry', key: 'Entry' },
            { name: 'Report', key: 'Report' }
          ]
        },
        { 
          name: 'Dmm Settings Parameter', 
          key: 'Dmm Settings Parameter',
          hasSubmenu: true,
          submenuItems: [
            { name: 'Entry', key: 'Entry' },
            { name: 'Report', key: 'Report' }
          ]
        }
      ]
    },
    { 
      id: 5, 
      name: 'QC Production', 
      icon: <Briefcase />, 
      hasSubmenu: true, 
      department: 'QC - production',
      submenuItems: [
        { name: 'Entry', key: 'Entry' },
        { name: 'Report', key: 'Report' }
      ]
    },
    { 
      id: 6, 
      name: 'Micro Structure', 
      icon: <Microscope />, 
      hasSubmenu: true, 
      department: 'Micro Structure',
      submenuItems: [
        { name: 'Entry', key: 'Entry' },
        { name: 'Report', key: 'Report' }
      ]
    },
    { 
      id: 7, 
      name: 'Impact', 
      icon: <Hammer />, 
      hasSubmenu: true, 
      department: 'Impact',
      submenuItems: [
        { name: 'Entry', key: 'Entry' },
        { name: 'Report', key: 'Report' }
      ]
    },
    { 
      id: 8, 
      name: 'Sand Lab', 
      icon: <FlaskConical />, 
      hasSubmenu: true, 
      department: 'Sand Lab',
      submenuItems: [
        { 
          name: 'Sand Testing Record', 
          key: 'Sand Testing Record',
          hasSubmenu: true,
          submenuItems: [
            { name: 'Entry', key: 'Entry' },
            { name: 'Report', key: 'Report' }
          ]
        },
        { 
          name: 'Foundry Sand Testing Note', 
          key: 'Foundry Sand Testing Note',
          hasSubmenu: true,
          submenuItems: [
            { name: 'Entry', key: 'Entry' },
            { name: 'Report', key: 'Report' }
          ]
        }
      ]
    },
    { 
      id: 9, 
      name: 'Melting', 
      icon: <GiMeltingMetal />, 
      hasSubmenu: true, 
      department: 'Melting',
      submenuItems: [
        { 
          name: 'Melting Log Sheet', 
          key: 'Melting Log Sheet',
          hasSubmenu: true,
          submenuItems: [
            { name: 'Entry', key: 'Entry' },
            { name: 'Report', key: 'Report' }
          ]
        },
        { 
          name: 'Cupola Holder Log Sheet', 
          key: 'Cupola Holder Log Sheet',
          hasSubmenu: true,
          submenuItems: [
            { name: 'Entry', key: 'Entry' },
            { name: 'Report', key: 'Report' }
          ]
        }
      ]
    },
  ];

  const filteredDepartments = filterDepartments(departments);

  // Handle menu item click - navigate to route
  const handleMenuItemClick = (dept, submenuItem = null, nestedItem = null) => {
    let route = '#';
    
    if (nestedItem) {
      // Nested submenu item (e.g., Moulding -> Disamatic Product -> Entry/Report)
      route = getRouteForNestedSubmenu(dept.name, submenuItem?.key, nestedItem.key);
    } else if (submenuItem) {
      // Regular submenu item (e.g., Process -> Entry/Report)
      route = getRouteForDepartment(dept.name, submenuItem.key, 'entry');
    } else {
      // Direct department navigation (no submenu)
      route = getRouteForDepartment(dept.name, null, 'entry');
    }
    
    if (route && route !== '#') {
      navigate(route);
    }
  };

  // Toggle nested submenu item (e.g., Disamatic Product to show Entry/Report)
  const toggleSubmenuItem = (submenuItemKey, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Mark that this is a manual toggle
    isManualToggleRef.current = true;
    
    // Clear any pending collapse timeout
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    
    // Toggle the nested submenu item
    if (expandedSubmenuItem === submenuItemKey) {
      setExpandedSubmenuItem(null);
      manuallyCollapsedSubmenuRef.current.add(submenuItemKey);
    } else {
      setExpandedSubmenuItem(submenuItemKey);
      manuallyCollapsedSubmenuRef.current.delete(submenuItemKey);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Track previous pathname to detect route changes
  const prevPathnameRef = useRef(location.pathname);
  const isManualToggleRef = useRef(false); // Track if user manually toggled
  
  // Auto-expand section if current route matches (but respect manual collapse)
  React.useEffect(() => {
    // Skip auto-expand if user just manually toggled
    if (isManualToggleRef.current) {
      isManualToggleRef.current = false;
      return;
    }
    
    const routeChanged = prevPathnameRef.current !== location.pathname;
    prevPathnameRef.current = location.pathname;
    
    // Find which department section should be expanded based on current route
    let currentRouteDeptId = null;
    let currentRouteSubmenuItemKey = null;
    
    for (const dept of filteredDepartments) {
      if (dept.hasSubmenu) {
        // Check regular submenu items (like Process -> Entry/Report)
        const shouldExpand = dept.submenuItems?.some(item => {
          // Check if this submenu item has nested submenus (like Moulding -> Disamatic Product -> Entry/Report)
          if (item.hasSubmenu && item.submenuItems) {
            // Check nested submenu items
            for (const nestedItem of item.submenuItems) {
              const nestedRoute = getRouteForNestedSubmenu(dept.name, item.key, nestedItem.key);
              if (location.pathname === nestedRoute) {
                currentRouteSubmenuItemKey = item.key;
                return true;
              }
            }
            return false;
          } else {
            // Regular submenu item (like Process -> Entry/Report)
            const itemRoute = getRouteForDepartment(dept.name, item.key, 'entry');
            return location.pathname === itemRoute;
          }
        });
        
        if (shouldExpand) {
          currentRouteDeptId = dept.id;
          
          // If route changed (navigated to a new page), clear manual collapse for this department
          // This allows auto-expand on navigation, but respects manual collapse for same route
          if (routeChanged) {
            manuallyCollapsedRef.current.delete(dept.id);
            if (currentRouteSubmenuItemKey) {
              manuallyCollapsedSubmenuRef.current.delete(currentRouteSubmenuItemKey);
            }
          }
          
          // Only auto-expand if user hasn't manually collapsed this section
          if (!manuallyCollapsedRef.current.has(dept.id)) {
            setExpandedSection(dept.id);
            // Expand nested submenu item if it exists
            if (currentRouteSubmenuItemKey && !manuallyCollapsedSubmenuRef.current.has(currentRouteSubmenuItemKey)) {
              setExpandedSubmenuItem(currentRouteSubmenuItemKey);
            }
            // Expand sidebar if pinned, otherwise hover will handle it
            if (isPinned) {
              setIsExpanded(true);
            }
          }
          break;
        }
      }
    }
    
    // Clear manual collapse for departments that don't match current route
    // This allows them to auto-expand again when navigating to them
    if (currentRouteDeptId !== null && routeChanged) {
      for (const dept of filteredDepartments) {
        if (dept.hasSubmenu && dept.id !== currentRouteDeptId) {
          manuallyCollapsedRef.current.delete(dept.id);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, filteredDepartments]);

  // Handle hover - expand on enter, collapse on leave (only if not pinned)
  const handleMouseEnter = () => {
    // Clear any pending collapse timeout
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    
    if (!isPinned) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = (e) => {
    // Only collapse on mouse leave if not pinned
    if (!isPinned) {
      // If a section is expanded, add a delay before collapsing
      // This gives users time to move mouse to submenu items
      if (expandedSection) {
        // Clear any existing timeout
        if (collapseTimeoutRef.current) {
          clearTimeout(collapseTimeoutRef.current);
        }
        // Set new timeout to collapse after delay
        collapseTimeoutRef.current = setTimeout(() => {
          // Double-check conditions before collapsing
          if (!isPinned) {
            setExpandedSection(null);
            setIsExpanded(false);
          }
          collapseTimeoutRef.current = null;
        }, 300);
      } else {
        // No section expanded, collapse immediately
        setExpandedSection(null);
        setIsExpanded(false);
      }
    }
  };

  // Handle pin/unpin toggle
  const handlePinToggle = (e) => {
    e.stopPropagation(); // Prevent any parent click events
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    
    if (newPinnedState) {
      // Pinning: expand sidebar and adjust page
      setIsExpanded(true);
      document.body.classList.add('sidebar-pinned-expanded');
      document.body.classList.remove('sidebar-pinned-collapsed');
    } else {
      // Unpinning: collapse sidebar and adjust page
      setIsExpanded(false);
      setExpandedSection(null);
      document.body.classList.remove('sidebar-pinned-expanded');
      document.body.classList.add('sidebar-pinned-collapsed');
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
      document.body.classList.remove('sidebar-expanded');
      document.body.classList.remove('sidebar-pinned-expanded');
      document.body.classList.remove('sidebar-pinned-collapsed');
    };
  }, []);

  return (
    <div 
      className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="sidebar-header">
        <img src="/images/Logo.svg" alt="Logo" className="logo" />
        {isExpanded && <span className="brand-name">Sakthi Auto</span>}
      </div>

      <div className="sidebar-content">
        {/* Admin Menu Item - Only show for admin users */}
        {isAdmin ? (
          <div className="menu-section">
            <div
              className={`menu-item ${location.pathname === '/admin' ? 'active' : ''}`}
              onClick={() => navigate('/admin')}
            >
              <span className="menu-icon"><ShieldCheck /></span>
              {!isExpanded && <span className="menu-tooltip">Admin</span>}
              {isExpanded && <span className="menu-text">Admin</span>}
            </div>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
            No accessible pages for your department
          </div>
        ) : (
          filteredDepartments.map((dept) => {
            // Check if this department section should be active
            let isActive = false;
            let routeType = null;
            
            if (dept.hasSubmenu) {
              // For departments with submenu, check if any submenu item or nested submenu item is active
              for (const item of dept.submenuItems || []) {
                // Check if this submenu item has nested submenus (like Moulding -> Disamatic Product -> Entry/Report)
                if (item.hasSubmenu && item.submenuItems) {
                  // Check nested submenu items
                  for (const nestedItem of item.submenuItems) {
                    const nestedRoute = getRouteForNestedSubmenu(dept.name, item.key, nestedItem.key);
                    if (location.pathname === nestedRoute) {
                      isActive = true;
                      break;
                    }
                  }
                } else {
                  // Regular submenu item (like Process -> Entry/Report)
                  const itemRoute = getRouteForDepartment(dept.name, item.key, 'entry');
                  if (location.pathname === itemRoute) {
                    isActive = true;
                    break;
                  }
                }
                if (isActive) break;
              }
              // Don't apply route type to main menu item for departments with submenu
              // Route type is shown only on the active submenu item
              routeType = null;
            } else {
              // For departments without submenu, check if entry or report route is active
              const entryRoute = getRouteForDepartment(dept.name, null, 'entry');
              const reportRoute = getRouteForDepartment(dept.name, null, 'report');
              const isEntryActive = isActiveRoute(entryRoute);
              const isReportActive = isActiveRoute(reportRoute);
              isActive = isEntryActive || isReportActive;
              routeType = isReportActive ? 'report' : (isEntryActive ? 'entry' : null);
            }
            
            return (
              <div key={dept.id} className="menu-section">
                <div 
                  className={`menu-item ${dept.hasSubmenu ? 'expandable' : ''} ${isActive ? 'active' : ''} ${routeType ? `route-${routeType}` : ''}`}
                  onClick={(e) => {
                    if (dept.hasSubmenu) {
                      // Toggle submenu when clicking on menu item with submenu
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSection(dept.id, e);
                    } else {
                      // Navigate directly for departments without submenu
                      handleMenuItemClick(dept);
                    }
                  }}
                >
                  <span className="menu-icon">{dept.icon}</span>
                  {!isExpanded && <span className="menu-tooltip">{dept.name}</span>}
                  {isExpanded && (
                    <>
                      <span className="menu-text">{dept.name}</span>
                      {dept.hasSubmenu && (
                        <span 
                          className="expand-icon"
                          title={expandedSection === dept.id ? 'Collapse submenu' : 'Expand submenu'}
                        >
                          {expandedSection === dept.id ? '▲' : '▼'}
                        </span>
                      )}
                    </>
                  )}
                </div>
                
                {isExpanded && dept.hasSubmenu && expandedSection === dept.id && (
                  <div className="submenu">
                    {dept.submenuItems?.map((item, index) => {
                      // Check if this submenu item has nested submenus (like Moulding -> Disamatic Product -> Entry/Report)
                      if (item.hasSubmenu && item.submenuItems) {
                        // Check if any nested submenu item is active
                        let isSubItemActive = false;
                        for (const nestedItem of item.submenuItems) {
                          const nestedRoute = getRouteForNestedSubmenu(dept.name, item.key, nestedItem.key);
                          if (location.pathname === nestedRoute) {
                            isSubItemActive = true;
                            break;
                          }
                        }
                        
                        // Check if this nested submenu item should be expanded
                        const isSubExpanded = expandedSubmenuItem === item.key;
                        
                        return (
                          <div key={index} className="submenu-item-wrapper">
                            <div 
                              className={`submenu-item expandable-submenu ${isSubItemActive ? 'active' : ''} ${isSubExpanded ? 'expanded' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSubmenuItem(item.key, e);
                              }}
                            >
                              <span className="submenu-item-name">{item.name}</span>
                              <span className="expand-icon">
                                {isSubExpanded ? '▲' : '▼'}
                              </span>
                            </div>
                            
                            {/* Nested submenu (Entry/Report) */}
                            {isSubExpanded && (
                              <div className="nested-submenu">
                                {item.submenuItems.map((nestedItem, nestedIndex) => {
                                  const nestedRoute = getRouteForNestedSubmenu(dept.name, item.key, nestedItem.key);
                                  const isNestedActive = location.pathname === nestedRoute;
                                  const nestedRouteType = nestedRoute.includes('/report') ? 'report' : 'entry';
                                  const nestedRouteTypeClass = isNestedActive ? `route-${nestedRouteType}` : '';
                                  
                                  return (
                                    <div
                                      key={nestedIndex}
                                      className={`nested-submenu-item ${isNestedActive ? 'active' : ''} ${nestedRouteTypeClass}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMenuItemClick(dept, item, nestedItem);
                                      }}
                                      data-route-type={nestedRouteType}
                                    >
                                      <span className="nested-submenu-item-name">{nestedItem.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        // Regular submenu item (like Process -> Entry/Report)
                        // Get the route for this submenu item
                        const itemRoute = getRouteForDepartment(dept.name, item.key, 'entry');
                        // Use exact match only - this prevents /process from matching /process/report
                        const isSubActive = location.pathname === itemRoute;
                        
                        // Determine route type from the route itself
                        // For Process: Entry -> '/process', Report -> '/process/report'
                        const itemRouteType = itemRoute.includes('/report') ? 'report' : 'entry';
                        
                        // Only apply route type class when this exact route is active
                        const routeTypeClass = isSubActive ? `route-${itemRouteType}` : '';
                        
                        return (
                          <div 
                            key={index} 
                            className={`submenu-item ${isSubActive ? 'active' : ''} ${routeTypeClass}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuItemClick(dept, item);
                            }}
                            data-route-type={itemRouteType}
                          >
                            <span className="submenu-item-name">{item.name}</span>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="sidebar-footer">
        <div className="footer-content">
          {/* Pin Toggle Button */}
          <button
            className={`pin-toggle-btn ${isPinned ? 'pinned' : ''}`}
            onClick={handlePinToggle}
            title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            <RiExpandRightFill />
          </button>

          <div
            className={`menu-item ${location.pathname === '/user-profile' ? 'active' : ''}`}
            onClick={() => navigate('/user-profile')}
            style={{ cursor: 'pointer' }}
          >
            <span className="menu-icon"><UserCog /></span>
            {!isExpanded && <span className="menu-tooltip">User Profile</span>}
            {isExpanded && <span className="menu-text">User Profile</span>}
          </div>
          <div
            className="menu-item logout-item"
            onClick={handleLogout}
          >
            <span className="menu-icon"><LogOut /></span>
            {!isExpanded && <span className="menu-tooltip">Logout</span>}
            {isExpanded && <span className="menu-text">Logout</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;