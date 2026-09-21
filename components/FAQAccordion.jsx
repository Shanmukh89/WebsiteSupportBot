import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const ITEMS = [
    {
        title: 'How does it work?',
        content: 'We analyze publicly available information from the store’s website and turn it into an AI assistant. When you ask a question, the system retrieves relevant information from the site and responds instantly in natural language.',
    },
    {
        title: 'Is this officially connected to the store?',
        content: 'No. This tool is not affiliated with any store. It simply uses publicly available website information to help you understand the store faster and more clearly.',
    },
    {
        title: 'Can it check product stock or availability?',
        content: 'Yes — if the store publicly displays stock or availability details, the AI can retrieve and explain them. If the information isn’t available on the website, it will let you know.',
    },
    {
        title: 'Is this free to use?',
        content: 'Yes, basic usage is free. Additional features may be introduced in future versions.',
    },
];

const AccordionItem = ({ title, content, isOpen, onClick }) => {
    const contentRef = useRef(null);

    // Height is smoothly transitioned based on the inner content's scrollHeight
    return (
        <div className={`dt-accordion-item ${isOpen ? 'open' : ''}`}>
            <button className="dt-accordion-trigger" onClick={onClick}>
                <span className="dt-accordion-title">{title}</span>
                <ChevronDown className="dt-accordion-icon" size={20} />
            </button>
            <div
                className="dt-accordion-content-wrapper"
                style={{ height: isOpen ? `${contentRef.current?.scrollHeight}px` : '0px' }}
            >
                <div className="dt-accordion-content" ref={contentRef}>
                    {content}
                </div>
            </div>
        </div>
    );
};

export const FAQAccordion = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const handleToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="dt-accordion-root" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            {ITEMS.map((item, index) => (
                <AccordionItem
                    key={index}
                    title={item.title}
                    content={item.content}
                    isOpen={openIndex === index}
                    onClick={() => handleToggle(index)}
                />
            ))}
        </div>
    );
};
