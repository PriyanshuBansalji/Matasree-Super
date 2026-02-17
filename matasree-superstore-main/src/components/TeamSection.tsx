import { Mail, Instagram, Phone } from 'lucide-react';
import { teamMembers } from '@/data/companyData';

const TeamSection = () => {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background to-background/95 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-3">Leadership Team</span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">
            Meet Our <span className="text-gradient-spice">Visionary Leaders</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Since 2008, our dedicated team at Matasree Super Industries has been committed to bringing the finest spices and masalas to your table.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
          {teamMembers.map((member, index) => (
            <div
              key={member.name}
              className="group bg-card rounded-3xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-500 border border-primary/10 hover:border-primary/30 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden bg-gradient-spice/10">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-serif text-xl font-bold text-foreground mb-1">
                  {member.name}
                </h3>
                <p className="text-primary font-medium text-sm mb-4">{member.role}</p>

                {/* Contact Links */}
                <div className="space-y-3">
                  {/* Email */}
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors duration-300 group/link"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover/link:bg-primary/20">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="truncate">{member.email}</span>
                  </a>

                  {/* Instagram */}
                  <a
                    href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors duration-300 group/link"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover/link:bg-primary/20">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <span className="truncate">{member.instagram}</span>
                  </a>

                  {/* Phone */}
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors duration-300 group/link"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover/link:bg-primary/20">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span>{member.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
