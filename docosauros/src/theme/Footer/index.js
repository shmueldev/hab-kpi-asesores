import React from 'react';
import Link from '@docusaurus/Link';
import {useThemeConfig} from '@docusaurus/theme-common';
import HabBike from '@site/src/components/HabBike';
import styles from './styles.module.css';

function Footer() {
  const {footer} = useThemeConfig();
  if (!footer) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.glow} />
      <div className={`container ${styles.row}`}>
        <div className={styles.brand}>
          <HabBike className={styles.bike} />
          <p className={styles.kicker}>Señal comercial</p>
          <strong>HAB KPI Asesores</strong>
        </div>
        {footer.links?.map((group) => (
          <div className={styles.col} key={group.title}>
            <p className={styles.colTitle}>{group.title}</p>
            <ul>
              {group.items.map((item) => (
                <li key={item.label}>
                  {item.to ? (
                    <Link to={item.to}>{item.label}</Link>
                  ) : (
                    <Link href={item.href}>{item.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {footer.copyright && (
        <p className={styles.copy} dangerouslySetInnerHTML={{__html: footer.copyright}} />
      )}
    </footer>
  );
}

export default React.memo(Footer);
