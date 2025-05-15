/**
 * Navigation bar component for the application
 */
const NavigationBar = ({ 
  activeTab, 
  onChangeTab, 
  onSaveLessons, 
  onLoadLessons,
  hasLessons
}) => {
  // Toggle dropdown menu for file operations
  const toggleDropdown = (e) => {
    e.preventDefault();
    const dropdown = document.getElementById('fileDropdown');
    dropdown.classList.toggle('show');
  };
  
  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.matches('.dropdown-toggle')) {
        const dropdowns = document.getElementsByClassName('dropdown-menu');
        for (let i = 0; i < dropdowns.length; i++) {
          const openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
          }
        }
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <a className="navbar-brand" href="#">
          Math Academy Lesson Generator
        </a>
        
        <div className="navbar-nav ml-auto">
          <ul className="navbar-nav">
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onChangeTab('upload');
                }}
              >
                Upload PDF
              </a>
            </li>
            
            {hasLessons && ([
                <li className="nav-item" key="lessons-tab">
                  <a 
                    className={`nav-link ${activeTab === 'lessons' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onChangeTab('lessons');
                    }}
                  >
                    Lessons
                  </a>
                </li>,
                
                <li className="nav-item" key="knowledge-graph-tab">
                  <a 
                    className={`nav-link ${activeTab === 'knowledge-graph' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onChangeTab('knowledge-graph');
                    }}
                  >
                    Knowledge Graph
                  </a>
                </li>
              ])
            }
            
            <li className="nav-item dropdown">
              <a 
                className="nav-link dropdown-toggle" 
                href="#" 
                id="navbarDropdown" 
                role="button" 
                aria-expanded="false"
                onClick={toggleDropdown}
              >
                File
              </a>
              <ul 
                className="dropdown-menu" 
                id="fileDropdown"
                aria-labelledby="navbarDropdown"
              >
                <li>
                  <a 
                    className="dropdown-item" 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onLoadLessons();
                      document.getElementById('fileDropdown').classList.remove('show');
                    }}
                  >
                    Load Lessons
                  </a>
                </li>
                
                {hasLessons && (
                  <li>
                    <a 
                      className="dropdown-item" 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onSaveLessons();
                        document.getElementById('fileDropdown').classList.remove('show');
                      }}
                    >
                      Save Lessons
                    </a>
                  </li>
                )}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
