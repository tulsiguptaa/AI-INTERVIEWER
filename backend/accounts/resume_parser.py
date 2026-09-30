import re
from typing import Dict, Any, List


KNOWN_SKILLS = [
    # Languages
    'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'golang', 'go', 'rust',
    'sql', 'html', 'css', 'php', 'ruby', 'kotlin', 'swift', 'r', 'scala',
    # Frameworks & Libraries
    'react', 'react.js', 'next.js', 'vue', 'angular', 'node.js', 'express', 'express.js',
    'django', 'flask', 'fastapi', 'spring boot', 'rails', 'tailwind', 'bootstrap',
    # Databases & Caching
    'postgresql', 'postgres', 'mysql', 'mongodb', 'sqlite', 'redis', 'elasticsearch',
    'cassandra', 'dynamodb', 'firebase',
    # Cloud & DevOps
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'git',
    'github', 'ci/cd', 'terraform', 'linux', 'nginx', 'kafka', 'graphql', 'rest api',
    # Core CS & Domains
    'data structures', 'algorithms', 'system design', 'machine learning', 'deep learning',
    'nlp', 'microservices', 'distributed systems', 'oop', 'web development'
]


def extract_text_from_pdf(file_obj) -> str:
    """
    Extracts raw text content from a PDF file stream using pypdf.
    Sanitizes null bytes to prevent PostgreSQL string storage errors.
    """
    try:
        from pypdf import PdfReader
        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)
        reader = PdfReader(file_obj)
        extracted_pages = []
        for page in reader.pages:
            try:
                page_text = page.extract_text()
                if page_text:
                    extracted_pages.append(page_text.strip())
            except Exception as page_err:
                print(f"[ResumeParser] Error extracting text from page: {page_err}")
        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)
        full_text = "\n\n".join(extracted_pages).strip()
        # PostgreSQL doesn't allow \x00 NUL characters in text fields
        return full_text.replace('\x00', '')
    except Exception as e:
        print(f"[ResumeParser] Error extracting text with pypdf: {e}")
        try:
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
        except Exception:
            pass
        return ""


def analyze_resume_text(text: str) -> Dict[str, Any]:
    """
    Analyzes raw resume text and extracts structured information for:
    - Education
    - Skills
    - Projects
    - Experience
    - Certifications
    """
    if not text:
        return {
            'education': [],
            'skills': [],
            'projects': [],
            'experience': [],
            'certifications': [],
            'summary': 'Resume received. Detailed parsing pending.'
        }

    lower_text = text.lower()
    lines = [line.strip() for line in text.split('\n') if line.strip()]

    # 1. Extract Skills
    found_skills: List[str] = []
    for skill in KNOWN_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, lower_text):
            formatted_skill = skill.title()
            # Standard casing adjustments
            overrides = {
                'Javascript': 'JavaScript',
                'Typescript': 'TypeScript',
                'Node.Js': 'Node.js',
                'Next.Js': 'Next.js',
                'React.Js': 'React',
                'React': 'React',
                'Aws': 'AWS',
                'Gcp': 'GCP',
                'Sql': 'SQL',
                'Postgresql': 'PostgreSQL',
                'Mongodb': 'MongoDB',
                'Graphql': 'GraphQL',
                'Ci/Cd': 'CI/CD',
                'Html': 'HTML',
                'Css': 'CSS',
                'Rest Api': 'REST APIs',
                'Oop': 'OOP',
            }
            clean_skill = overrides.get(formatted_skill, formatted_skill)
            if clean_skill not in found_skills:
                found_skills.append(clean_skill)

    # 2. Extract Education indicators
    education_items: List[str] = []
    edu_keywords = [
        'bachelor', 'b.tech', 'b.e.', 'b.s.', 'bs', 'btech', 'master', 'm.tech', 'm.s.',
        'ms', 'mtech', 'ph.d', 'phd', 'degree', 'university', 'institute', 'college',
        'computer science', 'information technology', 'engineering'
    ]
    for line in lines:
        l_lower = line.lower()
        if any(keyword in l_lower for keyword in edu_keywords) and len(line) < 120:
            if line not in education_items:
                education_items.append(line)
        if len(education_items) >= 4:
            break

    # 3. Extract Experience indicators
    experience_items: List[str] = []
    exp_keywords = [
        'intern', 'internship', 'developer', 'engineer', 'software engineer',
        'full stack', 'backend', 'frontend', 'co-op', 'consultant', 'analyst'
    ]
    for line in lines:
        l_lower = line.lower()
        if any(keyword in l_lower for keyword in exp_keywords) and len(line) < 120:
            if line not in experience_items:
                experience_items.append(line)
        if len(experience_items) >= 5:
            break

    # 4. Extract Projects indicators
    project_items: List[str] = []
    proj_keywords = ['project', 'developed', 'architected', 'built', 'created', 'implemented', 'designed']
    for line in lines:
        l_lower = line.lower()
        if any(l_lower.startswith(k) or f"{k} " in l_lower for k in proj_keywords) and 20 < len(line) < 160:
            if line not in project_items:
                project_items.append(line)
        if len(project_items) >= 5:
            break

    # 5. Extract Certifications
    cert_items: List[str] = []
    cert_keywords = ['certified', 'certification', 'certificate', 'aws certified', 'coursera', 'udemy', 'hackerrank']
    for line in lines:
        l_lower = line.lower()
        if any(keyword in l_lower for keyword in cert_keywords) and len(line) < 130:
            if line not in cert_items:
                cert_items.append(line)
        if len(cert_items) >= 4:
            break

    # Summary synthesis
    top_skills_preview = ", ".join(found_skills[:5]) if found_skills else "general technical competencies"
    summary = (
        f"Analyzed {len(found_skills)} technical skills ({top_skills_preview}). "
        f"Extracted {len(education_items)} academic markers, {len(experience_items)} role experiences, "
        f"and {len(project_items)} project highlights for interview calibration."
    )

    return {
        'education': education_items,
        'skills': found_skills,
        'projects': project_items,
        'experience': experience_items,
        'certifications': cert_items,
        'summary': summary
    }
