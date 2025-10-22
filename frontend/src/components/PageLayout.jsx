import React from 'react';
import NavigationBar from '../NavigationBar';
import './PageLayout.css';

const WIDTH_CLASSNAME = {
  sm: 'page-layout__container--sm',
  md: 'page-layout__container--md',
  lg: 'page-layout__container--lg',
  xl: 'page-layout__container--xl',
  full: 'page-layout__container--full',
};

function PageLayout({
  activePage,
  title,
  description,
  actions,
  children,
  maxWidth = 'xl',
  hideNav = false,
}) {
  const widthClass = WIDTH_CLASSNAME[maxWidth] || WIDTH_CLASSNAME.xl;

  return (
    <div className="page-layout">
      {!hideNav && <NavigationBar activePage={activePage} />}
      <main className="page-layout__main">
        <div className={`page-layout__container ${widthClass}`}>
          {(title || description || actions) && (
            <header className="page-layout__header">
              <div className="page-layout__heading">
                {title ? <h1 className="page-layout__title">{title}</h1> : null}
                {description ? (
                  <p className="page-layout__description">{description}</p>
                ) : null}
              </div>
              {actions ? <div className="page-layout__actions">{actions}</div> : null}
            </header>
          )}
          <div className="page-layout__content">{children}</div>
        </div>
      </main>
    </div>
  );
}

export default PageLayout;
