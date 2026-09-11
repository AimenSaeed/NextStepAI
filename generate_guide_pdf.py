# -*- coding: utf-8 -*-
import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont('Helvetica-Bold', 8)
        self.setFillColor(colors.HexColor('#64748b'))
        if self._pageNumber > 1:
            self.drawString(54, 750, 'NextStepAI -- Capstone Presentation Playbook & Guide')
            self.drawRightString(558, 750, 'AuratTech Data & AI Fellowship')
            self.setStrokeColor(colors.HexColor('#cbd5e1'))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        self.setFont('Helvetica', 8)
        self.drawString(54, 36, 'Strict 8-Min Presentation + 3-5 Min Q&A (Prioritizing Rubric)')
        page_text = f'Page {self._pageNumber} of {page_count}'
        self.drawRightString(558, 36, page_text)
        self.setStrokeColor(colors.HexColor('#cbd5e1'))
        self.setLineWidth(0.5)
        self.line(54, 46, 558, 46)
        self.restoreState()

def build_pdf(filename='NextStepAI_Presentation_Guide.pdf'):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=8
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=3
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5
    )

    alert_style = ParagraphStyle(
        'AlertText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#991b1b')
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=0
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#1e293b')
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold'
    )

    story = []

    story.append(Paragraph('NextStepAI - Capstone Presentation Guide', title_style))
    story.append(Paragraph('5-Member Team Playbook | Time Limit: Strict 8 Mins Presenting + 3-5 Mins Q&A', subtitle_style))
    story.append(HRFlowable(width='100%', thickness=1.5, color=colors.HexColor('#1e3a8a'), spaceAfter=8))

    notice_content = [
        [
            Paragraph('<b>CRITICAL RULE: PRIORITIZE THE MARKING RUBRIC OVER THE HANDOUT</b><br/>'
                      '&bull; <b>Strict 8-Minute Limit:</b> The handout suggests ~11 mins, but the official marking rubric strictly enforces <b>8 minutes max</b> before jurors cut you off. Target <b>7:30 to 7:45</b> for safety.<br/>'
                      '&bull; <b>50% Technical Weight:</b> <b>Technical Execution (30%)</b> and <b>Data & Methodology (20%)</b> account for half your entire grade. Highlight your data curation, FastAPI backend, two-stage matching logic, and validation.', alert_style)
        ]
    ]
    notice_table = Table(notice_content, colWidths=[504])
    notice_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef2f2')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#ef4444')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(notice_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph('1. Juror Rubric Weightings & Focus Areas', h1_style))
    rubric_data = [
        [Paragraph('Rubric Criterion', table_header), Paragraph('Weight', table_header), Paragraph('What Jurors Look For', table_header)],
        [Paragraph('Technical Execution & Correctness', table_cell_bold), Paragraph('30%', table_cell_bold), Paragraph('Sound technical approach; functioning code/pipeline; robust backend & matching logic.', table_cell)],
        [Paragraph('Data & Methodology Quality', table_cell_bold), Paragraph('20%', table_cell_bold), Paragraph('Data curation, cleaning, validation, normalization of messy criteria, suitable architecture.', table_cell)],
        [Paragraph('Results, Insights & Impact', table_cell_bold), Paragraph('15%', table_cell_bold), Paragraph('Clear findings, meaningful real-world impact for Pakistani students, actionable metrics.', table_cell)],
        [Paragraph('Innovation & Independent Thinking', table_cell_bold), Paragraph('15%', table_cell_bold), Paragraph('Original approach beyond generic tutorials; explainable eligibility reasons vs black-box search.', table_cell)],
        [Paragraph('Problem Framing & Relevance', table_cell_bold), Paragraph('10%', table_cell_bold), Paragraph('Clear real-world problem definition (fragmented scholarship landscape in Pakistan).', table_cell)],
        [Paragraph('Presentation & Communication', table_cell_bold), Paragraph('5%', table_cell_bold), Paragraph('Clear structure, confident delivery, punchy slides (&gt;=28pt, &lt;=6 lines), time management.', table_cell)],
        [Paragraph('Q&A Handling', table_cell_bold), Paragraph('5%', table_cell_bold), Paragraph('Deep understanding of technical design, coordinated thoughtful answers without overlapping.', table_cell)],
    ]
    t_rubric = Table(rubric_data, colWidths=[150, 45, 309])
    t_rubric.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    story.append(t_rubric)
    story.append(Spacer(1, 8))

    story.append(Paragraph('2. Master 8-Minute Presentation Timeline (5 Speakers)', h1_style))
    timeline_data = [
        [Paragraph('Slide / Topic', table_header), Paragraph('Speaker', table_header), Paragraph('Duration', table_header), Paragraph('Timestamp', table_header), Paragraph('Key Rubric Target', table_header)],
        [Paragraph('Slide 1: Hook & Title', table_cell_bold), Paragraph('Member 1', table_cell), Paragraph('45 sec', table_cell), Paragraph('0:00 - 0:45', table_cell), Paragraph('Problem Framing', table_cell)],
        [Paragraph('Slide 2: Problem in Pakistan', table_cell_bold), Paragraph('Member 1', table_cell), Paragraph('50 sec', table_cell), Paragraph('0:45 - 1:35', table_cell), Paragraph('Problem Framing (10%)', table_cell)],
        [Paragraph('Slide 3: Solution Overview', table_cell_bold), Paragraph('Member 2', table_cell), Paragraph('45 sec', table_cell), Paragraph('1:35 - 2:20', table_cell), Paragraph('Problem-Solution Fit', table_cell)],
        [Paragraph('Slide 4: Data Pipeline & Schema', table_cell_bold), Paragraph('Member 2', table_cell), Paragraph('55 sec', table_cell), Paragraph('2:20 - 3:15', table_cell), Paragraph('Data & Methodology (20%)', table_cell)],
        [Paragraph('Slide 5: Architecture & Engine', table_cell_bold), Paragraph('Member 3', table_cell), Paragraph('55 sec', table_cell), Paragraph('3:15 - 4:10', table_cell), Paragraph('Technical Execution (30%)', table_cell)],
        [Paragraph('Slide 6: Innovation & Distinction', table_cell_bold), Paragraph('Member 3', table_cell), Paragraph('45 sec', table_cell), Paragraph('4:10 - 4:55', table_cell), Paragraph('Innovation (15%)', table_cell)],
        [Paragraph('Slide 7: Live System Demo', table_cell_bold), Paragraph('Member 4', table_cell), Paragraph('90 sec', table_cell), Paragraph('4:55 - 6:25', table_cell), Paragraph('Technical Working Proof', table_cell)],
        [Paragraph('Slide 8: Validation & Insights', table_cell_bold), Paragraph('Member 5', table_cell), Paragraph('50 sec', table_cell), Paragraph('6:25 - 7:15', table_cell), Paragraph('Results & Insights (15%)', table_cell)],
        [Paragraph('Slide 9: Impact, Future & Close', table_cell_bold), Paragraph('Member 5', table_cell), Paragraph('40 sec', table_cell), Paragraph('7:15 - 7:55', table_cell), Paragraph('Impact & Delivery (15%+5%)', table_cell)],
        [Paragraph('Q&A Defense Session', table_cell_bold), Paragraph('All (Lead coords)', table_cell), Paragraph('3-5 min', table_cell), Paragraph('8:00 - 12:00', table_cell), Paragraph('Q&A Handling (5%)', table_cell)],
    ]
    t_timeline = Table(timeline_data, colWidths=[130, 75, 45, 65, 189])
    t_timeline.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('ALIGN', (2,0), (3,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f0fdf4')])
    ]))
    story.append(t_timeline)
    story.append(Spacer(1, 10))

    story.append(PageBreak())

    story.append(Paragraph('3. Detailed Slide-by-Slide Content & Delivery Guide', h1_style))
    story.append(Paragraph('<i>Rule: Keep on-slide text to max 4-5 short bullet points. Font &gt;= 28pt. Visuals carry the weight; you provide the narrative.</i>', body_style))
    story.append(Spacer(1, 4))

    slides_content = [
        ('Slide 1: Hook & Title (Member 1 -- 45s)', [
            '<b>On-Slide Content:</b> NextStepAI | Intelligent, Personalized Opportunity Discovery | Team names & roles.',
            '<b>Visual:</b> Clean branding logo and an attention-grabbing national stat callout.',
            '<b>Speaker Focus:</b> Hook the audience immediately: "70% of qualified Pakistani students miss higher education funding not because funds are missing, but because they never discover them in time."'
        ]),
        ('Slide 2: Problem Framing & Relevance (Member 1 -- 50s)', [
            '<b>On-Slide Content:</b> 40+ scattered portals & PDFs | Opaque eligibility quotas | High cost of application errors.',
            '<b>Visual:</b> Split graphic: Confused student vs. maze of fragmented government & global scholarship websites.',
            '<b>Speaker Focus:</b> Highlight specific Pakistani realities (provincial quotas, income brackets, test costs).',
            '<b>Handoff Bridge:</b> "To share how we architected NextStepAI to bridge this gap, I pass over to [Member 2]."'
        ]),
        ('Slide 3: NextStepAI Solution Overview (Member 2 -- 45s)', [
            '<b>On-Slide Content:</b> One Unified Profile | Deterministic Eligibility Verification | Multi-Factor Fit Scoring.',
            '<b>Visual:</b> 3-box pipeline: [Student Profile] -> [Intelligent Matching Core] -> [Ranked & Explainable Results].',
            '<b>Speaker Focus:</b> Explain the product vision clearly and concisely before diving into the data layer.'
        ]),
        ('Slide 4: Data Engineering & Methodology Quality (Member 2 -- 55s) [Rubric: 20%]', [
            '<b>On-Slide Content:</b> Curated multi-provincial dataset | Schema normalization (GPA vs %, deadlines) | Automated validation pipeline.',
            '<b>Visual:</b> Diagram showing raw CSVs/spreadsheets -> validation scripts -> structured SQLite/relational database.',
            '<b>Speaker Focus:</b> Highlight how unstructured criteria (e.g. "Opens ~Aug") were normalized into structured database constraints.',
            '<b>Handoff Bridge:</b> "Now [Member 3] will explain our backend engine and matching algorithms."'
        ]),
        ('Slide 5: System Architecture & Technical Execution (Member 3 -- 55s) [Rubric: 30%]', [
            '<b>On-Slide Content:</b> FastAPI REST services (/match, /opportunities/count) | Stage 1: Hard filter checks | Stage 2: Weighted multi-fit scoring.',
            '<b>Visual:</b> High-level backend architecture flowchart showing API contracts, eligibility filters, and scoring modules.',
            '<b>Speaker Focus:</b> Walk through the multi-factor scoring (Academic fit, Field fit, Funding fit, Domicile fit).'
        ]),
        ('Slide 6: Innovation & Independent Thinking (Member 3 -- 45s) [Rubric: 15%]', [
            '<b>On-Slide Content:</b> Explainable Matching (reasons_failed) | Deterministic accuracy over hallucinating LLMs | Vector AI for career goals.',
            '<b>Visual:</b> Feature matrix comparing NextStepAI vs. basic search portals vs. unconstrained LLM chatbots.',
            '<b>Speaker Focus:</b> Prove original design thinking: explain why pure LLMs fail at eligibility checks and how hybrid scoring solves it.',
            '<b>Handoff Bridge:</b> "Let\'s see NextStepAI in action. [Member 4] will now run the live demonstration."'
        ]),
        ('Slide 7: Live System Demonstration (Member 4 -- 90s) [Rubric: 30%]', [
            '<b>On-Slide Content:</b> Live execution video/browser | Real student persona input | Dynamic ranked output with score breakdown.',
            '<b>Visual:</b> Screen recording or live UI showing profile submission and instant categorized matches.',
            '<b>Speaker Focus:</b> Narrate the flow: show an eligible high-scoring match, and specifically highlight a "Not Eligible" item showing reasons_failed.',
            '<b>Handoff Bridge:</b> "To share our validation results and long-term vision, here is [Member 5]."'
        ]),
        ('Slide 8: Results, Insights & Validation (Member 5 -- 50s) [Rubric: 15%]', [
            '<b>On-Slide Content:</b> &lt; 200ms API response time | High accuracy against benchmark student personas | Discovery time cut from days to seconds.',
            '<b>Visual:</b> KPI metric cards and benchmark validation charts.',
            '<b>Speaker Focus:</b> Provide evidence of correctness: show that the pipeline works reliably across diverse edge cases.'
        ]),
        ('Slide 9: Impact, Future Roadmap & Closing (Member 5 -- 40s) [Rubric: 15% + 5%]', [
            '<b>On-Slide Content:</b> Democratizing higher ed funding | Next: WhatsApp integration & Urdu localization | Thank You!',
            '<b>Visual:</b> Roadmap icons & team contact info.',
            '<b>Speaker Focus:</b> Strong, memorable closing. Reiterate team passion and open the floor for jury Q&A.',
            '<b>Closing Bridge:</b> "Thank you for your time. We are now excited to answer your questions, led by [Q&A Lead]."'
        ])
    ]

    for title, points in slides_content:
        slide_block = []
        slide_block.append(Paragraph(title, h2_style))
        for pt in points:
            slide_block.append(Paragraph(f'&bull; {pt}', bullet_style))
        slide_block.append(Spacer(1, 2.5))
        story.append(KeepTogether(slide_block))

    story.append(Spacer(1, 6))
    story.append(PageBreak())

    story.append(Paragraph('4. Group Roles, Handover Scripts & Delivery Rules', h1_style))
    rules_text = (
        '<b>Slide Rules:</b> One slide = one idea. Big font (&gt;=28pt). Max 4-6 lines per slide. The slide supports you; do NOT read off it.<br/>'
        '<b>Delivery Rules:</b> Memorize your first line for a confident start. Speak slowly and pause. Notes should be keywords only.<br/>'
        '<b>Timekeeper Role:</b> One member watches a phone timer and signals at 6:00 (2 min left), 7:00 (1 min left), and 7:45 (wrap up).<br/>'
        '<b>Q&A Coordinator Role:</b> One designated member acknowledges each juror\'s question and delegates it to the relevant domain expert.'
    )
    story.append(Paragraph(rules_text, body_style))
    story.append(Spacer(1, 6))

    handoff_data = [
        [Paragraph('Transition', table_header), Paragraph('Exact Verbatim Script Bridge', table_header)],
        [Paragraph('M1 -&gt; M2', table_cell_bold), Paragraph('"To share how we architected NextStepAI and curated our multi-provincial data, I pass over to [Name]."', table_cell)],
        [Paragraph('M2 -&gt; M3', table_cell_bold), Paragraph('"Now [Name] will walk you through our backend matching engine and algorithmic architecture."', table_cell)],
        [Paragraph('M3 -&gt; M4', table_cell_bold), Paragraph('"Let\'s see NextStepAI in action. [Name] will now demonstrate the working system live."', table_cell)],
        [Paragraph('M4 -&gt; M5', table_cell_bold), Paragraph('"To present our validation results, measurable impact, and roadmap, here is [Name]."', table_cell)],
        [Paragraph('M5 -&gt; Q&A', table_cell_bold), Paragraph('"Thank you. We are now open for your feedback and questions, which [Name] will coordinate."', table_cell)]
    ]
    t_handoff = Table(handoff_data, colWidths=[80, 424])
    t_handoff.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    story.append(t_handoff)
    story.append(Spacer(1, 10))

    story.append(Paragraph('5. Anticipated Juror Questions & Strategic Defense', h1_style))
    qa_items = [
        ('Q1: How do you handle unstructured or frequently changing scholarship criteria?', 
         '<b>Target Speaker: Member 2 (Data).</b> Answer: "We engineered a decoupled data loader and an /admin/refresh-data endpoint. Incomplete deadlines and disparate GPA criteria are normalized into standard schema fields with fallback tolerances, so data updates never require server downtime."'),
        ('Q2: Why not just use a generative AI model (like ChatGPT) to answer student queries directly?',
         '<b>Target Speaker: Member 3 (Architecture).</b> Answer: "LLMs hallucinate eligibility constraints, and in higher education, a false match means wasted application fees and missed deadlines. We use deterministic algorithms for strict quota and academic validation, leveraging AI strictly for semantic search and career goal alignment."'),
        ('Q3: How did you validate that your multi-attribute scoring weights are realistic?',
         '<b>Target Speaker: Member 3 or 5 (Scoring/Validation).</b> Answer: "We benchmarked the algorithm using synthetic and real student profiles from all 4 provinces, calibrating weights so that critical constraints (financial need and domicile quotas) carry decisive weight over soft preferences."'),
        ('Q4: If a juror asks about a feature you haven\'t built yet:',
         '<b>Protocol:</b> "That is a fantastic point and an essential item on our post-fellowship roadmap. In our current architecture we prioritized [related feature], and we plan to incorporate your suggestion into our next release sprint."')
    ]

    for q, a in qa_items:
        qa_block = []
        qa_block.append(Paragraph(f'<b>{q}</b>', h2_style))
        qa_block.append(Paragraph(a, bullet_style))
        qa_block.append(Spacer(1, 2))
        story.append(KeepTogether(qa_block))

    story.append(Spacer(1, 8))

    story.append(Paragraph('6. Self-Run Mock Rehearsal Schedule (Before the Jury)', h1_style))
    mock_steps = [
        '<b>Round 1 (Strict 8-Min Timer):</b> Run the entire presentation from start to finish without pausing. One teammate acts as juror and notes time overruns.',
        '<b>Round 2 (Trimming & Bridges):</b> Cut unnecessary verbal filler. Practice the verbatim bridges until transitions take under 5 seconds.',
        '<b>Round 3 (Simulated Q&A):</b> Have the mock juror ask 3 difficult technical questions to test coordinated team responses.'
    ]
    for step in mock_steps:
        story.append(Paragraph(f'&bull; {step}', bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f'PDF successfully generated: {filename}')

if __name__ == '__main__':
    out_file = sys.argv[1] if len(sys.argv) > 1 else 'NextStepAI_Presentation_Guide.pdf'
    build_pdf(out_file)
